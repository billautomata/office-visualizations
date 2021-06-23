import React from 'react'
import * as d3 from 'd3'
import CSVOfficeSeries from '../data/the_office_series.csv'
import { InfoSharp } from '@material-ui/icons'

export default class TheOffice extends React.Component {

    constructor (props) {
      super(props)
      this.state = {}
      this.svgRef = React.createRef()
      this.drawBlocksSquareAlt = this.drawBlocksSquareAlt.bind(this)
    }

    componentDidMount() {
      console.log('mounted')
      d3.csv(CSVOfficeSeries).then(this.drawBlocksSquareAlt)
    }

    drawBlocksSquareAlt (episodes) {

      const color = d3.scaleOrdinal().range(d3.schemeCategory10)
      // const color = d3.scaleOrdinal().range(d3.schemeTableau10)
      // const color = d3.scaleOrdinal().range(d3.schemePaired)
        
      const hoverElements = {
        writers: {},
        episodes: {},
        lines: {}
      }

      const w = 1400
      const h = 730
      const svg = d3.select(this.svgRef.current)
        .attr('viewBox', `0 0 ${w} ${h}`)
        .attr('width', '100%')
        .style('max-width', '1400px')
        .style('min-width', '900px')
        // .attr('width', w).attr('height', h)
        // .style('outline', '1px solid black')      

      let runningX = 0
      let runningY = 0      
      const blockSpacingX = 60
      const blocksOffset = { x: 15, y: 260 }
      const rectDimensions = { width: 140, height: 18 }
      runningX += blocksOffset.x
      runningY += blocksOffset.y
      episodes.forEach((episode,episodeIdx)=>{        
        const gLocal = svg.append('g').attr('transform', `translate(${runningX} ${runningY})`)
          .on('mouseover', ()=>{
            hoverOverEpisode(episode)
          })
          .on('mouseout', ()=>{
            touchEverything(true)
          })

        hoverElements.episodes[episodeIdx] = gLocal

        episode.coordinates = { x: runningX, y: runningY, alignRight: episodeIdx % 2 === 0 }

        gLocal.append('clipPath').attr('id', `clip-path-episode-${episodeIdx}`)
          .append('rect').attr('x', 0).attr('y', 0).attr('stroke', 'black')
          .attr('width', rectDimensions.width)
          .attr('height', rectDimensions.height)
          
        gLocal.append('rect').attr('x', 0).attr('y', 0)
          .attr('width', rectDimensions.width)
          .attr('height', rectDimensions.height)
          .attr('fill', color(Number(episode.Season)))          
          .attr('stroke', 'white')

        gLocal.append('text').text(episode.EpisodeTitle)
          .attr('x', episodeIdx % 2 === 0 ? rectDimensions.width - 5 : 5)
          .attr('y', rectDimensions.height*0.5)
          .attr('dy', '.33em')
          .attr('font-size', rectDimensions.height*.7)
          .attr('fill', 'white')
          .attr('font-weight', 500)
          .attr('text-anchor', episodeIdx % 2 === 0 ? 'end' : 'start')
          .attr('clip-path', `url(#clip-path-episode-${episodeIdx})`).attr('pointer-events', 'none')

        runningX += rectDimensions.width + 1 + (episodeIdx % 2 === 0 ? blockSpacingX : 0 )
        if(runningX + rectDimensions.width >= (w)) {
          runningY += rectDimensions.height + 1
          runningX = blocksOffset.x
        }
      })

      // populate writers array to associate episodes
      const writers = {}
      episodes.forEach(episode=>{
        episode.writersArray = []
        if(episode.Writers.indexOf(' | ') === -1) {
          if (writers[episode.Writers] === undefined) {
            writers[episode.Writers] = 0
          }
          writers[episode.Writers] += 1
          episode.writersArray.push(episode.Writers)
        } else {
          episode.Writers.split(' | ').forEach(_element=>{
            if (writers[_element] === undefined) {
              writers[_element] = 0
            }
            writers[_element] += 1 / episode.Writers.split(' | ').length  
            episode.writersArray.push(_element)
          })
        }
      })

      const writersArray = toArray(writers)
      const writerSpacing = 30.5
      const writerBlockDimensions = { x: 160, y: 18 }
      const writerOffset = { x: 30, y: 150 }

      const line = d3.line().x(d=>d.x).y(d=>d.y).curve(d3.curveBundle.beta(1))
      const scaleYPull = d3.scaleLinear().domain([0,d3.max(episodes,d=>d.coordinates.y)]).range([0,20])
      const scaleYWriterBlock = d3.scaleLinear().domain([0,21]).range([0,writerBlockDimensions.x-3])

      writersArray.forEach((writer,writerIdx)=>{
        const episodesThisWriterCreditedOn = episodes.filter(o=>{ return o.writersArray.indexOf(writer.name) !== -1 })
        writer.episodesWritten = episodesThisWriterCreditedOn
        // console.log(writer)        
        const gLocal = svg.append('g').attr('transform', `translate(${writerOffset.x + (writerIdx*writerSpacing)} ${writerOffset.y}) rotate(-45)`)
          .attr('fill', 'black').attr('font-size', writerBlockDimensions.y * 0.8)
          .on('mouseover', ()=>{
            hoverOverWriter(writer)
          })
          .on('mouseout', ()=>{
            touchEverything(true)
          })

        hoverElements.writers[writer.name] = gLocal

        gLocal.append('rect').attr('x', 0).attr('y',-1.5)
          .attr('width', writerBlockDimensions.x).attr('height', writerBlockDimensions.y+3)
          .attr('fill', '#FFF')
          .attr('stroke', '#AAA')

        const gLocalBars = gLocal.append('g')
        
        gLocal.append('text').text(writer.name)
          .attr('x', 5).attr('y', writerBlockDimensions.y*0.4)
          .attr('dy', '0.33em').attr('font-weight', 500).attr('pointer-events', 'none')
        gLocal.append('text').text(round(writer.value))
          .attr('x', writerBlockDimensions.x - 5).attr('y', writerBlockDimensions.y*0.5)
          .attr('dy', '0.33em').attr('pointer-events', 'none')
          .attr('text-anchor', 'end')
        
        const lineSpacing = 20
        
        let runningXEpisode = 1
        writer.episodesWritten.forEach(episode=>{
          gLocalBars.append('rect').attr('x', runningXEpisode).attr('y', writerBlockDimensions.y * 0.75 + 1)
            .attr('width', scaleYWriterBlock(1 / episode.writersArray.length))
            .attr('height', writerBlockDimensions.y * 0.25)
            .attr('fill', color(Number(episode.Season)))
          
          runningXEpisode += scaleYWriterBlock(1 / episode.writersArray.length)

          // draw line
          const epCoordinate = {
            x: episode.coordinates.x + (episode.coordinates.alignRight ? rectDimensions.width + lineSpacing : -lineSpacing), 
            y: episode.coordinates.y + (rectDimensions.height*0.5) }
          // console.log(epCoordinate)
          const pts = [
            // { x: writerOffset.x + (writerIdx*writerSpacing) + (writerBlockDimensions.y*0.33), y: writerOffset.y + (writerBlockDimensions.y*0.33) },
            { x: writerOffset.x + (writerIdx*writerSpacing) + (writerBlockDimensions.y*0.66), y: writerOffset.y + (writerBlockDimensions.y*0.66) },
            { x: writerOffset.x + (writerIdx*writerSpacing) - (writerBlockDimensions.y*0.66), y: writerOffset.y + 40 },
            { x: writerOffset.x + (writerIdx*writerSpacing) + (writerBlockDimensions.y*0.33), y: writerOffset.y + 70 },
            { x: epCoordinate.x, y: writerOffset.y + 80 },
            { x: epCoordinate.x, y: writerOffset.y + 100 },
            { x: epCoordinate.x + (episode.coordinates.alignRight ? scaleYPull(epCoordinate.y) : -scaleYPull(epCoordinate.y)), y: epCoordinate.y },
            { x: epCoordinate.x + (episode.coordinates.alignRight ? -lineSpacing : lineSpacing), y: epCoordinate.y },
          ]
          const path = svg.append('path').datum(pts).attr('d',line).attr('stroke', color(Number(episode.Season))).attr('fill','none')
            .attr('stroke-width', rectDimensions.height*0.3)
            .attr('stroke-opacity', 1).attr('pathLength', 1)
            .attr('stroke-dasharray', '0 1')

          if(hoverElements.lines[episode.index] === undefined) {
            hoverElements.lines[episode.index] = {}  
          }
          hoverElements.lines[episode.index][writer.name] = path

          const speed = 1
          path.transition().duration(speed).delay(writerIdx*(speed/10))
              .attr('stroke-dasharray', '1 0')
        })

      })

      let offTimeout = {}
      let onTimeout = {}

      function hoverOverWriter (writer) {
        touchEverything(false)
        hoverElements.writers[writer.name].attr('opacity', 1)
        writer.episodesWritten.forEach(episode=>{
          hoverElements.episodes[episode.index].attr('opacity', 1)
          hoverElements.lines[episode.index][writer.name].attr('opacity', 1)
        })
      }

      function hoverOverEpisode (episode) {        
        touchEverything(false)
        hoverElements.episodes[episode.index].attr('opacity', 1)
        Object.values(hoverElements.lines[episode.index]).forEach(line=>{
          line.attr('opacity', 1)
        })
        episode.writersArray.forEach(writer=>{
          hoverElements.writers[writer].attr('opacity', 1)
        })
      }

      function touchEverything (onOrOff) {        
        if(onOrOff) {
          clearTimeout(offTimeout)
          onTimeout = setTimeout(()=>{performAction(onOrOff)},100)
        } else {
          clearTimeout(onTimeout)
          performAction(onOrOff)
        }
      }

      function performAction (onOrOff) {
        const v = onOrOff ? 1 : 0.2
        Object.values(hoverElements.writers).forEach(element=>{
          element.attr('opacity', v)          
        })
        Object.values(hoverElements.lines).forEach(element=>{
          Object.values(element).forEach(line=>{
            line.attr('opacity', onOrOff ? 1 : v*0.1)
          })          
        })
        Object.values(hoverElements.episodes).forEach(element=>{
          element.attr('opacity', v)
        })    
      }

    }    

    render () {
      return (
        <div style={{textAlign: 'center', minWidth: '900px'}}>
          <svg ref={this.svgRef}/>
        </div>
      )
    }

}

function toArray(object) {
  return Object.keys(object).map(o=>{
    return { name: o, value: object[o] }
  }).sort((a,b)=>{return b.value - a.value})
}

function round(value) {
  const v = Number(value).toFixed(1)
  if(v.split('').pop() === '0') {
    return Number(value)
  } else {
    return v
  }
}