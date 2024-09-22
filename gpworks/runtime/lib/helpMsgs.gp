// Custom gpworks content

to getHelp blk {
  if ((platform) != 'Browser') {error 'TODO (prob useless tho)'} // bcuz who would run gpworks locally
  if (isClass blk 'Function') {blk = (getField blk 'cmdList')}
  if (isClass blk 'Command') {blk = (getField blk 'primName')} // either comes from turned to Function `blk` or just as a unparsed arg
  if (isClass blk 'Action') {blk = (getField blk 'function')}
  if (not (isClass blk 'String')) {error 'unsupported type'}
  return blk
}