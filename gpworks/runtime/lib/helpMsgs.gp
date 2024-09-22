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
  h = (hand (global 'page'))
  rep4 = 'REPLACE ME'
  initializeForConfirm p 'Help' rep4 'OK' ''
  myCat = (call (function a {
    cats = (categories (scripter (findProjectEditor))) // i wish cats were real
    specs = (toList (initialSpecs (authoringSpecs)))
    // openExplorer specs
    blkArr = (list)
    cnt = 1
    for c cats {
      sliceFrom = (indexOf specs c)
      sliceFrom += 1
      if (== cnt (count cats)) {
        sliceTo = nil
      } true {
        sliceTo = (indexOf specs (at cats (+ cnt 1)))
        sliceTo += -1
      }
      if (not (contains (map 'isNil' (list sliceFrom sliceTo)) true)) {
        currBlks = (copyFromTo specs sliceFrom sliceTo)
      }
      cnt += 1
    }
    openExplorer currBlks
    blks = (new 'Dictionary' (count cats) cats blkArr)
    // openExplorer blks
  }) blk)
  btns = (parts (getField p 'buttons'))
  hide (at btns (count btns))
  btns = (getField p 'buttons')
  setBounds btns (copy (fullBounds (first (parts btns))))
  redraw p
  setCenter (morph p) (x h) (y h)
  addPart (morph (global 'page')) (morph p)
  return req
}