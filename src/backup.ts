import { Writer } from 'clitastic'

import { config, VERBOSE } from './autorestic'
import { getEnvFromBackend } from './backend'
import { Locations, Location } from './types'
import { exec, ConfigError } from './utils'
import { CONFIG_FILE } from './config'
import { resolve, dirname, isAbsolute } from 'path'

export const backupSingle = (name: string, from: string, to: string) => {
  if (!config) throw ConfigError
  const writer = new Writer(name + to.blue + ' : ' + 'Backing up... ⏳')
  const backend = config.backends[to]

  // Check if is an absolute path, otherwise get the path relative to the config file
  const pathRelativeToConfigFile = isAbsolute(from)
    ? from
    : resolve(dirname(CONFIG_FILE), from)

  const cmd = exec('restic', ['backup', pathRelativeToConfigFile], {
    env: getEnvFromBackend(backend),
  })

  if (VERBOSE) console.log(cmd.out, cmd.err)
  writer.done(name + to.blue + ' : ' + 'Done ✓'.green)
}

export const backupLocation = (name: string, backup: Location) => {
  const display = name.yellow + ' ▶ '
  if (Array.isArray(backup.to)) {
    let first = true
    for (const t of backup.to) {
      const nameOrBlankSpaces: string = first
        ? display
        : new Array(name.length + 3).fill(' ').join('')
      backupSingle(nameOrBlankSpaces, backup.from, t)
      if (first) first = false
    }
  } else backupSingle(display, backup.from, backup.to)
}

export const backupAll = (backups?: Locations) => {
  if (!backups) {
    if (!config) throw ConfigError
    backups = config.locations
  }

  console.log('\nBacking Up'.underline.grey)
  for (const [name, backup] of Object.entries(backups))
    backupLocation(name, backup)
}
