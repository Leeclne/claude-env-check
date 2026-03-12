#!/usr/bin/env node
import { program } from 'commander'
import { runInit } from './commands/init.js'
import { runCheck } from './commands/check.js'

program
  .name('claude-env')
  .description('Claude Code 环境检测工具')
  .version('0.1.0')

program
  .command('init')
  .description('全局初始化：从 catalog 选择基线 skills/MCPs 偏好')
  .action(runInit)

program
  .command('check')
  .description('项目检测：对比基线，展示当前项目缺少哪些配置')
  .action(runCheck)

program.parse()
