export default function cleanUpLines (lines) {
  const charactersToRemove = ['?','.',',','!','-']
  lines = lines.filter(o=>{return o.deleted !== 'TRUE'})

  // clean up the lines
  lines.forEach(line=>{
    line.search_text = line.line_text.replace(RegExp('\\[.*?\\]'),'');          
    charactersToRemove.forEach((c,idx)=>{
      line.search_text = line.search_text.replaceAll(c,' ')
    })          
  })
}