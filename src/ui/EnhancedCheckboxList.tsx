import React, { useEffect, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { ACTIVITY_TIERS, formatInstalls } from '../catalog/filters.js'

/**
 * 计算字符串的终端显示宽度（CJK 双宽字符算 2 列）
 */
function displayWidth(str: string): number {
  let w = 0
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0
    // 覆盖常见 CJK 范围：全角、汉字、假名、谚文等
    w += (cp >= 0x1100 &&
      (cp <= 0x115f || cp === 0x2329 || cp === 0x232a ||
       (cp >= 0x2e80 && cp <= 0x303e) ||
       (cp >= 0x3040 && cp <= 0xa4cf) ||
       (cp >= 0xa960 && cp <= 0xa97f) ||
       (cp >= 0xac00 && cp <= 0xd7a3) ||
       (cp >= 0xf900 && cp <= 0xfaff) ||
       (cp >= 0xfe10 && cp <= 0xfe19) ||
       (cp >= 0xfe30 && cp <= 0xfe6f) ||
       (cp >= 0xff00 && cp <= 0xff60) ||
       (cp >= 0xffe0 && cp <= 0xffe6) ||
       (cp >= 0x1b000 && cp <= 0x1b001) ||
       (cp >= 0x1f004 && cp <= 0x1f0cf) ||
       (cp >= 0x1f200 && cp <= 0x1f251) ||
       (cp >= 0x20000 && cp <= 0x2fffd) ||
       (cp >= 0x30000 && cp <= 0x3fffd))) ? 2 : 1
  }
  return w
}

/**
 * 将字符串截断到指定显示列数，不足时右补空格
 */
function fitToWidth(str: string, cols: number): string {
  let w = 0
  let result = ''
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0
    const cw = (cp >= 0x1100 &&
      (cp <= 0x115f || (cp >= 0x2e80 && cp <= 0xa4cf) ||
       (cp >= 0xac00 && cp <= 0xd7a3) || (cp >= 0xf900 && cp <= 0xfaff) ||
       (cp >= 0xff00 && cp <= 0xff60) || (cp >= 0x20000 && cp <= 0x3fffd))) ? 2 : 1
    if (w + cw > cols - 1) {
      result += '…'
      w += 1
      break
    }
    result += ch
    w += cw
  }
  while (w < cols) { result += ' '; w++ }
  return result
}

export type ListItem = {
  name: string
  description: string
  source?: 'official' | 'community'
  installs?: number
}

type Props = {
  items: ListItem[]
  selected: Set<string>
  isActive: boolean
  onToggle: (name: string) => void
  onNext: () => void
  onBack?: () => void
  onQuit: () => void
}

const PAGE_SIZE = 12

export function EnhancedCheckboxList({
  items,
  selected,
  isActive,
  onToggle,
  onNext,
  onBack,
  onQuit,
}: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  // cursorInPage: 0..pageItems.length，其中 pageItems.length 表示 Save 行
  const [cursorInPage, setCursorInPage] = useState(0)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTierIndex, setFilterTierIndex] = useState(-1) // -1 = 全部

  // 过滤后的列表
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      q === '' ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)

    const matchesTier =
      filterTierIndex === -1 ||
      (() => {
        const tier = ACTIVITY_TIERS[filterTierIndex]
        const count = item.installs ?? 0
        return tier ? count >= tier.min && count <= tier.max : true
      })()

    return matchesSearch && matchesTier
  })

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages - 1)
  const pageStart = safePage * PAGE_SIZE
  const pageItems = filteredItems.slice(pageStart, pageStart + PAGE_SIZE)
  // Save 行的游标位置 = 当前页条目数
  const saveRowIndex = pageItems.length

  // 过滤/翻页后修正越界游标
  useEffect(() => {
    if (currentPage > totalPages - 1) setCurrentPage(totalPages - 1)
  }, [currentPage, totalPages])

  useEffect(() => {
    if (cursorInPage > saveRowIndex) setCursorInPage(saveRowIndex)
  }, [cursorInPage, saveRowIndex])

  // 重置到第一页（搜索/筛选变更时调用）
  function resetPage() {
    setCurrentPage(0)
    setCursorInPage(0)
  }

  // 列表模式输入
  useInput(
    (input, key) => {
      if (key.upArrow) {
        // ↑ 仅在当前页内向上移动
        setCursorInPage((c) => Math.max(0, c - 1))
      } else if (key.downArrow) {
        // ↓ 仅在当前页内向下移动（包含 Save 行）
        setCursorInPage((c) => Math.min(saveRowIndex, c + 1))
      } else if (key.leftArrow) {
        // ← 翻到上一页，游标回到第一项
        setCurrentPage((p) => Math.max(0, p - 1))
        setCursorInPage(0)
      } else if (key.rightArrow) {
        // → 翻到下一页，游标回到第一项
        setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
        setCursorInPage(0)
      } else if (key.return || input === ' ') {
        if (cursorInPage === saveRowIndex) {
          // 在 Save 行按 Enter/空格 → 直接进入下一步
          onNext()
        } else if (input === ' ') {
          // 在列表项按空格 → 切换选中
          const item = pageItems[cursorInPage]
          if (item) onToggle(item.name)
        }
        // 在列表项按 Enter 无效，引导用户移到 Save 行
      } else if (key.escape) {
        onBack?.()
      } else if (input === '/') {
        setIsSearchMode(true)
        setSearchQuery('')
        resetPage()
      } else if (input === 'f') {
        setFilterTierIndex((i) => (i >= ACTIVITY_TIERS.length - 1 ? -1 : i + 1))
        resetPage()
      } else if (input === 'q') {
        onQuit()
      }
    },
    { isActive: isActive && !isSearchMode },
  )

  // 搜索模式输入
  useInput(
    (input, key) => {
      if (key.escape || key.return) {
        setIsSearchMode(false)
        resetPage()
      } else if (key.backspace || key.delete) {
        setSearchQuery((q) => q.slice(0, -1))
        resetPage()
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setSearchQuery((q) => q + input)
        resetPage()
      }
    },
    { isActive: isActive && isSearchMode },
  )

  const activeTierLabel =
    filterTierIndex >= 0 ? (ACTIVITY_TIERS[filterTierIndex]?.label ?? '全部') : '全部'

  const isFiltered = searchQuery !== '' || filterTierIndex >= 0

  return (
    <Box flexDirection="column" gap={1}>
      {/* 搜索/筛选状态栏 */}
      <Box flexDirection="row" gap={2}>
        {isSearchMode ? (
          <Text color="yellow">
            🔍 搜索: <Text>{searchQuery}</Text>
            <Text color="yellow">_</Text>
            <Text color="gray">  Esc/Enter 结束</Text>
          </Text>
        ) : (
          <Text color="gray">
            {'/ 搜索  '}
            <Text>f 活跃度: </Text>
            <Text color={filterTierIndex >= 0 ? 'yellow' : 'gray'}>{activeTierLabel}</Text>
          </Text>
        )}
      </Box>

      {/* 列表 */}
      <Box flexDirection="column">
        {filteredItems.length === 0 ? (
          <Text color="gray">  无匹配项</Text>
        ) : (
          pageItems.map((item, i) => {
            const isSelected = selected.has(item.name)
            const isCursor = i === cursorInPage
            return (
              <Box key={item.name} flexDirection="row">
                {/* 游标（1列+空格）*/}
                <Text color={isCursor ? 'cyan' : undefined}>{isCursor ? '> ' : '  '}</Text>
                {/* 选框（3列+空格）*/}
                <Text color={isSelected ? 'green' : 'white'}>{isSelected ? '[x] ' : '[ ] '}</Text>
                {/* 名称：固定 22 显示列 */}
                <Text bold={isCursor} color={isCursor ? 'cyan' : 'white'}>
                  {fitToWidth(item.name, 22)}
                </Text>
                {/* 描述：固定 36 显示列（80 列终端下的安全上限），CJK-aware 截断 */}
                <Text color="gray">{fitToWidth(item.description, 36)}</Text>
                {/* 安装数：右对齐 6 列 */}
                <Text color="gray">
                  {(item.installs !== undefined ? formatInstalls(item.installs) : '').padStart(6)}
                </Text>
                {/* 来源标签（单空格间距，避免 CJK 双宽字符叠加撑宽） */}
                <Text color={item.source === 'official' ? 'green' : item.source === 'community' ? 'yellow' : 'gray'}>
                  {' '}{item.source === 'official' ? '[官方]' : item.source === 'community' ? '[社区]' : ''}
                </Text>
              </Box>
            )
          })
        )}
      </Box>

      {/* Save 行 */}
      <Box flexDirection="row" gap={1}>
        <Text color={cursorInPage === saveRowIndex ? 'cyan' : undefined}>
          {cursorInPage === saveRowIndex ? '>' : ' '}
        </Text>
        <Text
          bold={cursorInPage === saveRowIndex}
          color={cursorInPage === saveRowIndex ? 'cyan' : 'gray'}
        >
          {'[ 保存并继续 → ]'}
        </Text>
        {cursorInPage !== saveRowIndex && (
          <Text color="gray">（↓ 移到此处后按 Enter）</Text>
        )}
      </Box>

      {/* 底部状态栏 */}
      <Text color="gray">
        已选 {selected.size} |{' '}
        {isFiltered
          ? `筛选 ${filteredItems.length}/${items.length} 项 | `
          : `共 ${items.length} 项 | `}
        第 {safePage + 1}/{totalPages} 页
        {!isSearchMode && '  ↑↓ 选择  ←→ 翻页  空格 选择/保存  / 搜索  f 筛选'}
      </Text>
    </Box>
  )
}
