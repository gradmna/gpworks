// Custom gpworks content

to getHelp blk { // idk why this has so much compatability lmfao
  if ((platform) != 'Browser') {error 'TODO (prob useless tho)'} // bcuz who would run gpworks locally
  if (isClass blk 'Block') {blk = (getField blk 'expression')}
  if (isClass blk 'Function') {blk = (getField blk 'cmdList')}
  if (or (isClass blk 'Command') (isClass blk 'Commmand')) {
    // this has multiple ways to be triggered
    // 1.: from Block or Function (someone misspelled `Command` for the `Block` case)
    // 2.: just pass a `Command`
    blk = (getField blk 'primName')
  }
  if (isClass blk 'Action') {blk = (getField blk 'function')}
  if (not (isClass blk 'String')) {
    if (not (canStringify blk)) {error 'unsupported and/or unstringifiable type'}
    blk = (toString blk)
  }
  req = (startFetch (join './help.json?blk=' blk))
  p = (new 'Prompter')
  initializeForConfirm p '1' '2' 'OK' ''
  btns = (detect (function a {
    didLoop = false
    for ch (parts a) {
      didLoop = true
      if (!= (className (classOf (handler ch))) 'Trigger') {
        return false
      }
    }
    return didLoop // smart ass
  }) (parts (morph p)))
  removePart (last (parts btns)) btns
  addPart (morph (global 'page')) (morph p)
  return req
}