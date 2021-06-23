import React from 'react'
import * as d3 from 'd3'
import CSVOfficeSeries from '../data/the_office_series.csv'
import CSVOfficeLines from '../data/the-office-lines-scripts.csv'

export default class Empty extends React.Component {

    constructor (props) {
      super(props)
      this.state = {}
      this.svgRef = React.createRef()
    }

    componentDidMount() {
      console.log('mounted')
      const w = 960
      const h = 768

      const colorAlternate = d3.schemePaired[0]  

      const svg = d3.select(this.svgRef.current)        
        .attr('width', w).attr('height', h)
        // .style('outline', '1px solid black')
        .append('g').attr('transform', 'translate(50 0)')

      d3.csv(CSVOfficeLines).then(lines=>{
        d3.csv(CSVOfficeSeries).then(series=>{
          assignS00E00ToSeries(series)
          console.log('series length', series.length)
          console.log(series[1])
          console.log(lines[0])
          const speakers = {}
          const writers = {}      
          const writersPercent = {}    
          lines.forEach(line=>{
            if (speakers[line.speaker] === undefined) {
              speakers[line.speaker] = {
                seasons: d3.range(9).map(o=>{return 0}),
                writers: {}
              } 
            }
            if(speakers[line.speaker].writers[series.filter(o=>{ return Number(o.Season) === Number(line.season) && Number(o.seasonEpisode) === Number(line.episode) })[0].Writers] === undefined) {
              speakers[line.speaker].writers[series.filter(o=>{ return Number(o.Season) === Number(line.season) && Number(o.seasonEpisode) === Number(line.episode) })[0].Writers] = 0 
            }
            speakers[line.speaker].writers[series.filter(o=>{ return Number(o.Season) === Number(line.season) && Number(o.seasonEpisode) === Number(line.episode) })[0].Writers] += line.line_text.split(' ').length
            speakers[line.speaker].seasons[Number(line.season)-1] += line.line_text.split(' ').length
          })

          // top characters per words spoken
          const speakersRank = []
          Object.keys(speakers).forEach(speakerName=>{
            const value = speakers[speakerName]
            speakersRank.push({ name: speakerName, value: d3.sum(value.seasons, d=>d)})
          })
          const topSpeakers = speakersRank.sort((a,b)=>{ return b.value - a.value}).slice(0,25).map(o=>o.name)
          console.log('top speakers', JSON.stringify(topSpeakers))

          lines.forEach(line=>{            
            // find writers
            if (topSpeakers.indexOf(line.speaker) === -1) { return }

            const writersOfLine = series.filter(o=>{ return Number(o.Season) === Number(line.season) && Number(o.seasonEpisode) === Number(line.episode) })[0].Writers.split(' | ')
            writersOfLine.forEach(writer=>{
              if (writers[writer] === undefined) {
                writers[writer] = {}
              }
              if(writers[writer][line.speaker] === undefined) {
                writers[writer][line.speaker] = 0
              }
              writers[writer][line.speaker] += line.line_text.split(' ').length  
            })
          })

          const writersRank = []
          Object.keys(writers).forEach(writerName=>{
            const value = writers[writerName]
            const totalWords = d3.sum(Object.values(value), d=>d)
            writersRank.push({ name: writerName, value: totalWords})
            writersPercent[writerName] = []
            Object.keys(value).forEach(character=>{              
              const count = value[character]
              writersPercent[writerName].push({ name: character, percent: count / totalWords, count })
            })
            writersPercent[writerName] = writersPercent[writerName].sort((a,b)=>{ return b.percent - a.percent})
          })
          const topWriters = writersRank.sort((a,b)=>{ return b.value - a.value }).slice(0,10)
          console.log('topWriters', JSON.stringify(topWriters))
          
          const margins = { top: 170, left: 120, bottom: 0, right: 152 }

          const scaleXWriter = d3.scaleLinear().domain([0, topWriters.length]).range([0,w-margins.left-margins.right])
          const scaleYSpeaker = d3.scaleLinear().domain([0, topSpeakers.length]).range([0,h-margins.top])
          const scaleRPercent = d3.scalePow().exponent(1/3)

          const color = d3.scaleOrdinal(d3.schemeCategory10)

          // do a matrix
          topSpeakers.forEach((speakerName, speakerIndex)=>{
            svg.append('text').text(speakersRank.filter(o=>o.name===speakerName)[0].value)
              .attr('x', margins.left-20).attr('y', scaleYSpeaker(speakerIndex)+margins.top+5)
              .attr('text-anchor','end').attr('dy', '0.33em')
              .attr('font-weight',700).attr('font-size', 12)
              .append('tspan').text(speakerName)
              .attr('dx',10).attr('font-weight', 400)
              .attr('font-size', 14)

          })

          // find the top writer for each character
          const topWritersForEachSpeaker = {}
          topSpeakers.forEach((speakerName)=>{
            const listForThisSpeaker = Object.keys(writersPercent).map(writerName=>{
              const lookup = writersPercent[writerName].filter(o=>{return o.name === speakerName})[0]
              return { name: writerName, value: lookup === undefined ? 0 : lookup.percent }
            }).sort((a,b)=>{return b.value - a.value}).filter(o=>{ return topWriters.map(o=>{return o.name}).indexOf(o.name) !== -1 })
            console.log(speakerName, '-', listForThisSpeaker[0].name)
            topWritersForEachSpeaker[speakerName] = listForThisSpeaker[0].name
          })

          // Object.keys(writersPercent).forEach((writerName,writerIndex)=>{
          topWriters.forEach((writer,writerIndex)=>{
            const writerObject = writersPercent[writer.name]
            // console.log(writer.name, writerObject)
            const gLocal = svg.append('g').attr('transform', `translate(${scaleXWriter(writerIndex)+margins.left+10} ${margins.top})`)
            const gLabel = gLocal.append('g').attr('transform', 'translate(7.5 -12) rotate(-60)')
            
            gLabel.append('rect').attr('x',-17).attr('y',-25)
              .attr('width', 220).attr('height',40)
              .attr('fill', writerIndex % 2 === 0 ? colorAlternate : '#FFF')
            
            gLabel.append('text').text(writer.name)
              .attr('x', 2).attr('y', -6)
              .attr('font-size', 14).attr('dy', '0.33em')
              .append('tspan').attr('dx',10).attr('font-weight',700).attr('font-size', 12).text(writer.value)
            
            gLocal.append('rect')
              .attr('x', scaleXWriter(1)*-0.5).attr('y',-10)
              .attr('width', scaleXWriter(1)).attr('height', h-margins.top+5)
              .attr('fill', writerIndex % 2 === 0 ? colorAlternate : '#FFF')

            topSpeakers.forEach((speaker,speakerIndex)=>{
              const speakerData = writerObject.filter(o=>{return o.name === speaker})[0]

              gLocal.append('text')
                .text(speakerData !== undefined ? Number(speakerData.percent*100).toFixed(1) : '0.0')
                .attr('cx',0).attr('y', scaleYSpeaker(speakerIndex)+5).attr('dy', '0.33em')
                .attr('fill', '#000')
                .attr('text-anchor','middle')
                .attr('font-size', topWritersForEachSpeaker[speaker] !== writer.name ? 12 : 15)
                .attr('font-weight',topWritersForEachSpeaker[speaker] !== writer.name ? 400 : 700)
                .append('tspan').attr('font-size',8).text(' %')

            })
          })

          // svg.append('line').attr('x1',margins.left-5).attr('y1',margins.top-10).attr('x2',w).attr('y2', margins.top-10).attr('stroke', 'black')
          // svg.append('line').attr('x1',margins.left-5).attr('y1',margins.top-10.5).attr('x2',margins.left-5).attr('y2', h).attr('stroke', 'black')

          console.log(Object.keys(writersPercent).length)

        })
      })

      function assignS00E00ToSeries(series) {
        let runningEpisode = 1
        series.forEach((episode,episodeIndex)=>{
          const nextEpisode = series[episodeIndex+1]
          episode.seasonEpisode = runningEpisode
          if(nextEpisode !== undefined) {
            if(episode.Season === nextEpisode.Season) {
              runningEpisode += 1              
            } else {
              runningEpisode = 1
            }
          }
        })
      }

    }



    render () {
      return (
        <div style={{ textAlign: 'center' }}>
          <svg ref={this.svgRef}/>
        </div>
      )
    }

}

function toArray(object) {
  return Object.keys(object).map(o=>{
    return { name: o, value: object[o] }
  }).sort((a,b)=>{return d3.sum(b.value,d=>d) - d3.sum(a.value,d=>d)})
}