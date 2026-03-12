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

  // Filtered list (sorted by installs descending)
  const filteredItems = items
    .filter((item) => {
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
    .sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0))

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages - 1)
  const pageStart = safePage * PAGE_SIZE
  const pageItems = filteredItems.slice(pageStart, pageStart + PAGE_SIZE)
  // Save 行的游标位置 = 当前页条目数
  const saveRowIndex = pageItems.length

  // Clamp out-of-bounds cursor after filter/page change
  useEffect(() => {
    if (currentPage > totalPages - 1) setCurrentPage(totalPages - 1)
  }, [currentPage, totalPages])

  useEffect(() => {
    if (cursorInPage > saveRowIndex) setCursorInPage(saveRowIndex)
  }, [cursorInPage, saveRowIndex])

  // Reset to first page (called on search/filter change)
  function resetPage() {
    setCurrentPage(0)
    setCursorInPage(0)
  }

  // List mode input
  useInput(
    (input, key) => {
      if (key.upArrow) {
        // ↑ move up within current page
        setCursorInPage((c) => Math.max(0, c - 1))
      } else if (key.downArrow) {
        // ↓ move down within current page (includes Save row)
        setCursorInPage((c) => Math.min(saveRowIndex, c + 1))
      } else if (key.leftArrow) {
        // ← previous page, reset cursor
        setCurrentPage((p) => Math.max(0, p - 1))
        setCursorInPage(0)
      } else if (key.rightArrow) {
        // → next page, reset cursor
        setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
        setCursorInPage(0)
      } else if (key.return || input === ' ') {
        if (cursorInPage === saveRowIndex) {
          // Enter/Space on Save row → proceed to next step
          onNext()
        } else if (input === ' ') {
          // Space on list item → toggle selection
          const item = pageItems[cursorInPage]
          if (item) onToggle(item.name)
        }
        // Enter on list item is a no-op; guide user to move to Save row
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

  // Search mode input
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
            🔍 Search: <Text>{searchQuery}</Text>
            <Text color="yellow">_</Text>
            <Text color="gray">  Esc/Enter to exit</Text>
          </Text>
        ) : (
          <Text color="gray">
            {'/ search  '}
            <Text>f activity: </Text>
            <Text color={filterTierIndex >= 0 ? 'yellow' : 'gray'}>{activeTierLabel}</Text>
          </Text>
        )}
      </Box>

      {/* 列表 */}
      <Box flexDirection="column">
        {filteredItems.length === 0 ? (
          <Text color="gray">  No matches</Text>
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
                {/* source label */}
                <Text color={item.source === 'official' ? 'green' : item.source === 'community' ? 'yellow' : 'gray'}>
                  {' '}{item.source === 'official' ? '[official]' : item.source === 'community' ? '[community]' : ''}
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
          {'[ Save & Continue → ]'}
        </Text>
        {cursorInPage !== saveRowIndex && (
          <Text color="gray">(↓ move here then press Enter)</Text>
        )}
      </Box>

      {/* 底部状态栏 */}
      <Text color="gray">
        Selected {selected.size} |{' '}
        {isFiltered
          ? `filtered ${filteredItems.length}/${items.length} | `
          : `total ${items.length} | `}
        page {safePage + 1}/{totalPages}
        {!isSearchMode && `  ↑↓ move  ←→ page  space select  / search  f filter${onBack ? '  Esc back' : ''}`}
      </Text>
    </Box>
  )
}
