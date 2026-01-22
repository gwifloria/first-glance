import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * 序列化器接口，用于自定义类型的存储和读取
 */
interface Serializer<T> {
  serialize: (value: T) => unknown
  deserialize: (value: unknown) => T
}

/**
 * 通用持久化状态 Hook
 * 使用 chrome.storage.local 存储，支持跨 tab 同步
 *
 * @param storageKey - storage 中的键名
 * @param defaultValue - 默认值
 * @param serializer - 可选的序列化器，用于处理特殊类型（如 Set）
 */
export function usePersistedState<T>(
  storageKey: string,
  defaultValue: T,
  serializer?: Serializer<T>
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue)
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 保存待持久化的值，用于组件卸载时立即保存
  const pendingValueRef = useRef<T | null>(null)
  const serializerRef = useRef(serializer)

  // 更新 serializer ref（在 effect 中更新以避免 render 期间修改 ref）
  useEffect(() => {
    serializerRef.current = serializer
  }, [serializer])

  // 初始化时从 storage 读取
  useEffect(() => {
    chrome.storage.local
      .get(storageKey)
      .then((result) => {
        if (result[storageKey] !== undefined) {
          const storedValue = serializerRef.current
            ? serializerRef.current.deserialize(result[storageKey])
            : result[storageKey]
          setValue(storedValue)
        }
      })
      .catch(() => {
        // storage 读取失败时保持默认值
      })
  }, [storageKey])

  // 组件卸载时立即保存待持久化的数据
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current)
        pendingSaveRef.current = null
      }
      // 如果有待保存的数据，立即保存
      if (pendingValueRef.current !== null) {
        const valueToStore = serializerRef.current
          ? serializerRef.current.serialize(pendingValueRef.current)
          : pendingValueRef.current
        chrome.storage.local.set({ [storageKey]: valueToStore }).catch(() => {
          // 忽略卸载时的保存错误
        })
      }
    }
  }, [storageKey])

  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(prev)
            : newValue

        // 记录待保存的值
        pendingValueRef.current = next

        // 防抖保存：200ms 内的多次更新合并为一次写入
        if (pendingSaveRef.current) {
          clearTimeout(pendingSaveRef.current)
        }
        pendingSaveRef.current = setTimeout(() => {
          const valueToStore = serializerRef.current
            ? serializerRef.current.serialize(next)
            : next
          chrome.storage.local
            .set({ [storageKey]: valueToStore })
            .catch((err) => {
              console.error(
                `[usePersistedState] 保存失败 (${storageKey}):`,
                err
              )
            })
          pendingSaveRef.current = null
          pendingValueRef.current = null
        }, 200)

        return next
      })
    },
    [storageKey]
  )

  return [value, updateValue]
}

/**
 * Set 类型的序列化器
 */
export const setSerializer: Serializer<Set<string>> = {
  serialize: (value) => [...value],
  deserialize: (value) => new Set(value as string[]),
}
