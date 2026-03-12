#!/usr/bin/env node
import { program } from 'commander'
import { runInit } from './commands/init.js'
import { runCheck } from './commands/check.js'

program
  .name('claude-env')
  .description('Claude Code environment baseline manager')
  .version('0.1.0')

program
  .command('init')
  .description('Global setup: choose baseline skills/MCPs from the catalog')
  .action(runInit)

program
  .command('check')
  .description('Project check: compare against baseline and show missing items')
  .action(runCheck)

program.parse()
