import React from 'react'
import * as d3 from 'd3'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import CSVOfficeLines from '../data/the-office-lines-scripts.csv'
import CSVOfficeSeries from '../data/the_office_series.csv'
import OfficeLogo from '../img/the-office.svg'
import SpiralScreen from './LoadingScreen.js'

// todo
// code clean-up
// add writer to the expanded view 
// remove the pie chart, use a full width bar chart for episodes

// bugs

// tests
//

export default class OfficeQuoteSearch extends React.Component {

    constructor (props) {
      super(props)
      this.state = {}
      this.svgRef = React.createRef()
      this.svgRef2 = React.createRef()
      this.textFieldRef = React.createRef()
      this.treemapRef = React.createRef()

      this.state = {
        doneLoading: false,
        quote: "that's what she said",
        matches: []
      }
      this.lines = {}
      this.series = []
      this.defaultLimitResults = 300
      this.limitResults = this.defaultLimitResults      
      this.hoverFilterCharacter = null
      this.expandAll = false

      this.dataLoaded = false
      this.searchTimeout = {}

      this.runD3Code = this.runD3Code.bind(this)

    }

    componentDidMount () {
      this.runD3Code()
    }

    componentDidUpdate() {
      this.runD3Code()
    }

    runD3Code() {

      if(this.props.series.length === undefined ||
        this.props.lines.length === undefined ||
        this.dataLoaded === true) {
          return
      }

      const self = this

      window.d3 = d3

      const margins = { top: 25, left: 100, right: 0, bottom: 20 }
      const w = 1024
      const h = 384

      const treeMapDimensions = { width: 1024, height: 172 }
      const treemapParent = d3.select(this.treemapRef.current)
        .style('position', null)
        .style('height', `${treeMapDimensions.height+16}px`)
        .append('div').style('position', 'relative')
        .style('user-select', 'none')
        .style('cursor', 'pointer')
        .style('padding-bottom', treeMapDimensions.height)
        
      const color = d3.scaleOrdinal(['#a6cee3'])
      const textColor = d3.scaleOrdinal(['#333', '#333'])

      const svg = d3.select(this.svgRef.current)
        .attr('width', w).attr('height', h)        
        .style('font-family', 'Roboto')
        .style('user-select', 'none')
        // .style('outline', '1px solid black')

      const svg2 = d3.select(this.svgRef2.current)
        .attr('width', 192).attr('height', 192)
        .style('font-family', 'Roboto')
        .style('user-select', 'none')
        // .style('outline', '1px solid black')

      const gParent = svg.append('g').attr('transform', `translate(${margins.left} ${margins.top})`)
      
      const seasons = d3.range(9)

      // const charactersToRemove = ['?','.',',','!','-']

      const series = this.props.series
      const lines = this.props.lines 

      self.series = series
      self.lines = lines

      self.dataLoaded = true

      // populate the episodes
      lines.forEach(line=>{
        seasons[Number(line.season)-1] = Number(line.episode)
      })

      const scaleX = d3.scaleLinear().domain([0,d3.max(seasons,d=>d)]).range([0,w-margins.left-margins.right])
      const scaleY = d3.scaleLinear().domain([0,seasons.length]).range([0,h-margins.top-margins.bottom])

      const elements = {}

      const gLegendEpisodes = gParent.append('g').attr('transform', `translate(${0} ${h-margins.bottom-27})`).style('user-select', 'none')

      gLegendEpisodes.append('text').text('EPISODE').attr('text-anchor', 'end').attr('x',-33 ).attr('font-size', 10)
        .attr('letter-spacing', 1).attr('dy', '0.33em').attr('fill','#AAA')
      gLegendEpisodes.append('line').attr('x1',0).attr('y1',0).attr('x2',scaleX(25)).attr('y2',0).attr('stroke', "#AAA")
      d3.range(d3.max(seasons)).forEach(ep=>{
        gLegendEpisodes.append('circle').attr('cx',scaleX(ep)).attr('cy',0).attr('r',10).attr('fill','white').attr('stroke', '#CCC')
        gLegendEpisodes.append('text').text(ep+1).attr('x', scaleX(ep)).attr('y', 0).attr('dy','0.33em')
          .attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', '#AAA')
      })

      seasons.forEach((season,seasonIndex)=>{
        const gLocal = gParent.append('g').attr('transform', `translate(${0} ${scaleY(seasonIndex)})`)
        elements[seasonIndex] = {}
        gLocal.append('line').attr('x1',0).attr('y1',0).attr('x2',scaleX(season-1)).attr('y2',0).attr('stroke', "#AAA")
        gLocal.append('text').text(`Season ${seasonIndex+1}`).attr('text-anchor','end')
          .attr('x', -24)
          .attr('font-size', 14).attr('font-weight', 700)
          .attr('dy', '0.33em').attr('letter-spacing', '.5px')
          .attr('fill', '#777').style('user-select', 'none')

        d3.range(season).forEach(episode=>{
          const gEpisode = gLocal.append('g')
            .attr('transform', `translate (${scaleX(episode)} ${0})`)
            .attr('data-testid', 'circle_parent')
          elements[seasonIndex][episode] = gEpisode
          gEpisode.append('circle').attr('data-testid', `circle_${seasonIndex}_${episode}`).attr('cx', 0).attr('cy',0).attr('r',14)
            .attr('stroke', '#AAA').attr('fill', 'white')
          gEpisode.append('text').attr('cx', 0).attr('cy',0).attr('dy','0.33em').attr('text-anchor', 'middle')            
            .text(1).attr('font-size', 12).attr('font-weight', 700)
            .attr('fill', 'white')
        })
      })

      const gPieChart = svg2.append('g').attr('transform', 'translate(92 72)')
      d3.range(2).forEach(n=>{
        gPieChart.append('path').attr('class', `_${n}`).attr('stroke', n === 1 ? '#AAA' : 'none') // .attr('stroke', 'black')
      })
      const gPieChartLabel = gPieChart.append('g').attr('transform', 'translate(0 70)')
      const textPieChartLabel = gPieChartLabel.append('text').text(`${0} of 186`)
        .attr('text-anchor', 'middle').attr('font-size', 18).attr('font-weight', 500)

      gPieChartLabel.append('text').text(`EPISODES`).attr('y', 18)
        .attr('text-anchor', 'middle').attr('font-size', 12).attr('font-weight', 300)
        .attr('letter-spacing', .5)
        
      const arcFunction = d3.arc().innerRadius(0).outerRadius(50)

      // ====================================================================================================================
      // ====================================================================================================================
      self.updateGraphs = function (searchString) {
        if(self.state.quote.length === 0) {
          return
        }
        self.hoverFilterCharacter = null
        self.expandAll = false
        let matches = {}

        // build the bubble dataset          
        function updateBubbles () {
          let episodesFound = 0
          matches = lines.filter(o=>{ 
            if(self.hoverFilterCharacter !== null) {
              if(o.speaker !== self.hoverFilterCharacter) {
                return false
              }
            }
            if(searchString.toLowerCase().trim().split(' ').length === 1) {
              return o.search_text.toLowerCase().split(' ').indexOf(searchString.toLowerCase().trim()) !== -1               
            } else {
              return o.search_text.toLowerCase().indexOf(searchString.toLowerCase().trim()) !== -1 
            }            
          })

          matches.forEach(match=>{
            match.showMore = self.expandAll
          })            

          Object.values(elements).forEach((episodes,seasonIdx)=>{
            Object.values(episodes).forEach((episode,episodeIdx)=>{
              episode.select('circle').attr('fill', 'white').attr('stroke', '#AAA').style('cursor', null).on('click', null)
              episode.select('text').text(0).attr('fill', 'white').attr('pointer-events', 'none').style('user-select', 'none')
            })
          })

          const seasonsAndEpisodesCounts = matches.reduce((accumulator, value)=>{
            const S = Number(value.season) - 1
            const E = Number(value.episode) - 1
            if(accumulator[S] === undefined) {
              accumulator[S] = {}
            }
            if(accumulator[S][E] === undefined) {              
              accumulator[S][E] = 0
            }
            accumulator[S][E] += 1
            return accumulator
          }, {})

          // iterate over the bubbles and populate the ones with results that match the seasons
          Object.values(elements).forEach((episodes,seasonIdx)=>{
            Object.values(episodes).forEach((episode,episodeIdx)=>{
              if(seasonsAndEpisodesCounts[seasonIdx] !== undefined && seasonsAndEpisodesCounts[seasonIdx][episodeIdx] !== undefined) {
                episodesFound += 1
                episode.select('circle')
                  .attr('fill', '#a6cee3')
                  .attr('stroke', 'none')
                  .style('cursor', 'pointer')
                  .on('click', ()=>{
                    const reference = document.getElementById(`quote_${seasonIdx+1}_${episodeIdx+1}`)
                    if(reference === null) {
                      return
                    }
                    window.scrollTo({
                      top: reference.offsetTop,
                      behavior: 'smooth'
                    })
                  })
                episode.select('text').text(seasonsAndEpisodesCounts[seasonIdx][episodeIdx])
                  .attr('fill', '#333') 
              }
            })
          })
          // pie chart for how many episodes this term appears in
          const episodesCount = episodesFound
          const totalEpisodes = 186
          const pieFn = d3.pie()//.sortValues((a,b)=>{return a-b})
          const arcs = pieFn([episodesCount,totalEpisodes-episodesCount])

          textPieChartLabel.text(`${episodesCount} of 186`)

          arcs.forEach((arc,arcIndex)=>{
            gPieChart.select(`path._${arcIndex}`).datum(arc).attr('d', arcFunction).attr('fill', ['#a6cee3', 'none'][arcIndex])
          })            
        }
        updateBubbles()
        self.setState({ matches: matches})
        // characters in the matches
        const characters = matches.reduce((accumulator, object)=>{
          // console.log(object)
          if(accumulator[object.speaker] === undefined) {
            accumulator[object.speaker] = { name: object.speaker, value: 0, seasonEpisodes: [] }
          }
          accumulator[object.speaker].value += 1
          accumulator[object.speaker].seasonEpisodes.push( {season: object.season, episode: object.episode })
          return accumulator
        },{})

        const treemap = d3.treemap()
          .tile(d3.treemapSquarify.ratio(2))
          .size([treeMapDimensions.width, treeMapDimensions.height])
          .padding(1)
          .round(true)(d3.hierarchy({name: '', children: Object.values(characters)}).sum(d => d.value).sort((a, b) => b.value - a.value))
          //(d3.hierarchy({ name: 'ok', children: characters }).sum(d => d.value).sort((a, b) => b.value - a.value))

        treemapParent.selectAll('div').remove()

        treemap.leaves().forEach((leaf,idx)=>{
          const p = treemapParent.append('div')
            .attr('class', 'parentDiv')
            .attr('id', 'idx_'+leaf.data.name)
            .style('position', 'absolute')        
            .style('top', leaf.y0 +'px')
            .style('left', leaf.x0 +'px')
            .style('width', (leaf.x1 - leaf.x0)+'px')
            .style('height', (leaf.y1 - leaf.y0)+'px')
            .style('background', color(idx))
            .style('color', textColor(idx))
            .style('overflow', 'hidden')
            .style('box-sizing', 'border-box')
            .style('border-radius', '0%')
            .on('click', ()=>{
              if(self.hoverFilterCharacter === null || self.hoverFilterCharacter !== leaf.data.name) {
                self.hoverFilterCharacter = leaf.data.name
                self.limitResults = Number.MAX_SAFE_INTEGER
                treemapParent.selectAll('div.parentDiv').style('outline', null)
                p.style('outline', '1px solid #777')
                
              } else {
                self.hoverFilterCharacter = null
                treemapParent.selectAll('div.parentDiv').style('outline', null)
                self.limitResults = self.defaultLimitResults
              } 
              updateBubbles()               
              self.forceUpdate()
            })
          p.append('div').attr('class', 'name')
            .style('display', 'inline-block')
            .style('position','absolute')
            .style('top', '4px')
            .style('left', '4px')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text(leaf.data.name)
          p.append('div').attr('class', 'percent')
            .style('display', 'inline-block')
            .style('font-size', '10px')
            .style('font-weight', '400')
            .style('position','absolute')
            .style('top', '18px')
            .style('left', '4px')  
            .text(leaf.data.value)
        })            
      }  
      self.updateGraphs(self.state.quote)

    }

    render () {
      return (
        <Grid container style={{ textAlign: 'center', marginBottom: 1024 }}>
          <Grid container item justify='center' style={{margin: 'auto', width: 820}}>
            <Grid item xs={12}>
              <img src={OfficeLogo} style={{margin: 'auto'}}/>
            </Grid>
            <Grid item xs={12} 
              style={{ 
                cursor: 'pointer', color: '#777', 
                fontSize: 12, fontStyle: 'italic', 
                marginTop: 0, textAlign: 'right', marginRight: 32
              }}>
              {/* How does this work? */}
            </Grid>
            <Grid container item style={{padding: '12px 32px', textAlign: 'left', lineHeight: '1.33em'}}>
              <Grid item>
                This application lets you search every line from the NBC television show <a style={{color: 'steelblue'}} href="https://en.wikipedia.org/wiki/The_Office_(American_TV_series)">The Office</a>, and visualizes the results to give you insights as to which episode the quote the quote appears, who said the quote, and the lines before and after the quote.
              </Grid>
              <Grid item style={{width: 640}} xs={12}>
                <ul>
                  <li>Type word or phrase in the search box, and press the <b>Enter</b> key to search.</li>
                  <li>The bubble corresponding to that episode contains the number of times the word or phrase appears.</li>
                  <li style={{marginLeft: 0}}><b>Click</b> the episode bubble to view the matching lines from that episode.</li>
                  <li>The ratio of episodes where the quote appears is plotted beneath the episode bubbles.</li>
                  <li>There is a graph of the character who said the quote, and how many times they say the quote.</li>
                  <li style={{marginLeft: 0}}><b>Click</b> the box for the character to filter for only their lines.</li>
                  <li>Beneath the graphs is the list of lines that contain the quote.</li>
                  <li style={{marginLeft: 0}}><b>Click</b> "more" to see the lines immediately before and after the line with your search terms.</li>
                </ul>
              </Grid>
            </Grid>
          </Grid>
          {
            (()=>{
              if(this.dataLoaded === false) {
                return (
                  <Grid item xs={12}>
                    <SpiralScreen/>
                  </Grid>
                )
              } else {
                return (
                  <>
                  </>
                )
              }
            })()
          }
          <Grid container item style={{display: this.dataLoaded ? null : 'none' }}>
            <Grid container item xs={12}>
              <Grid item xs={12}>
                <TextField label="Quote" variant="outlined" 
                  defaultValue={this.state.quote} 
                  style={{width: 768, marginBottom: 4, marginTop: 12}}
                  onChange={(event)=>{ 
                    // console.log(event.nativeEvent.data, event.nativeEvent.target.value) 
                    this.setState({ quote: event.nativeEvent.target.value })
                  }}
                  onKeyUp={(event)=>{
                    // console.log(event.nativeEvent)
                    const self = this
                    clearTimeout(this.searchTimeout)
                    if(event.nativeEvent.code === 'Enter') {
                      self.updateGraphs(self.state.quote)
                    }                  
                  }}/>
              </Grid>
            </Grid>
            <Grid container item style={{ display: this.state.matches.length > 0 ? null : 'none' }}>
              <Grid item xs={12}>
                <svg ref={this.svgRef} data-testid='bubbles'/>
              </Grid>
              <Grid item container xs={12} justify='center'>
                {/* <Grid item xs={2}><svg ref={this.svgRef2}/></Grid> */}
                <Grid item xs={9}><div ref={this.treemapRef} style={{ position: 'relatdive' }} /></Grid>
              </Grid>         
              <Grid item container style={{width: 1024, margin: 'auto', fontFamily: 'Roboto', letterSpacing: 0.5}}>
                <Grid data-testid='results-found' item style={{ textAlign: 'right' }} xs={12}>
                  <b>{ this.hoverFilterCharacter === null ? this.state.matches.length : this.state.matches.filter(o=>{return o.speaker === this.hoverFilterCharacter}).length }</b> results found 
                  {
                    (()=>{
                      if (this.state.matches.length > this.limitResults) {
                        return (
                          <>
                            <br/>
                            <span style={{ fontSize: 12 }}>Showing {this.limitResults}. </span>
                            <span style={{ cursor: 'pointer', color: 'steelblue', fontSize: 10}}
                              onClick={()=>{
                                this.limitResults = this.state.matches.length + 1
                                this.forceUpdate()
                              }}>show all</span>
                          </>
                        )
                      }                  
                    })()
                  }
                </Grid>                        
                <Grid item container xs={12} alignItems='center' style={{ padding: 12, textAlign: 'center', marginBottom: 2, fontWeight: 600, letterSpacing: 1 }}>
                  <Grid item xs={1} style={{textDecoration: 'underline'}}>Season</Grid>
                  <Grid item xs={2} style={{textDecoration: 'underline'}}>Episode</Grid>
                  <Grid item xs={2} style={{textDecoration: 'underline'}}>Speaker</Grid>
                  {/* <Grid item xs={1}>&nbsp;</Grid> */}
                  <Grid item xs={6} style={{ textAlign: 'left', textDecoration: 'underline' }}>Line</Grid>
                  <Grid item xs={1} style={{ cursor: 'pointer', color: 'steelblue', fontSize: 10, fontWeight: 500, textAlign: 'right', textDecoration: 'none !important' }}
                      onClick={()=>{ this.expandAll = !this.expandAll; this.state.matches.forEach(match=>{match.showMore = this.expandAll}); this.forceUpdate() }}>
                        { this.expandAll !== true ? 'expand all' : 'collapse all' }
                  </Grid>
                </Grid>
                <Grid item container data-testid='matches'>
                  {
                    this.state.matches.slice(0,this.limitResults)
                      .filter(match=>{
                        if(this.hoverFilterCharacter === null) { 
                          return true 
                        } else {
                          return match.speaker === this.hoverFilterCharacter
                        }
                      })
                      .map((match,matchIndex)=>{
                      return (
                        <Grid data-testid={`matches_${match.id}`} id={`quote_${match.season}_${match.episode}`} key={`match_${match.id}`} item container xs={12} alignItems='center' style={{ borderRadius: 4, backgroundColor: matchIndex % 2 === 0 ? "#FFFFFF" : '#F3F3F3', padding: 12, textAlign: 'center', marginBottom: 0 }}>
                          <Grid item xs={1}>{match.season}</Grid>
                          <Grid item xs={2}>{this.series.filter(o=>{ return Number(o.Season) === Number(match.season) })[Number(match.episode)-1].EpisodeTitle}</Grid>
                          <Grid item xs={2}>{match.speaker}</Grid>
                          <Grid item xs={6} style={{ textAlign: 'left' }}>
                            {(()=>{
                              if (match.showMore === true) {
                                const previousLine = this.lines.filter(o=>{ return Number(o.id) === Number(match.id)-1 })[0]
                                return (
                                  <div style={{padding: '0px 0px 12px 0px'}}><b>{previousLine.speaker}</b> {previousLine.line_text}</div>
                                )
                              }
                            })()}
                            <b>{match.showMore ? match.speaker + ' ' : ''}</b>{match.line_text}
                            {(()=>{
                              if (match.showMore === true) {
                                const nextLine = this.lines.filter(o=>{ return Number(o.id) === Number(match.id)+1 })[0]
                                return (
                                  <div style={{padding: '12px 0px 0px 0px'}}><b>{nextLine.speaker}</b> {nextLine.line_text}</div>
                                )
                              }
                            })()}
                          </Grid>
                          <Grid item xs={1} style={{ cursor: 'pointer', color: 'steelblue', fontSize: 10, textAlign: 'right' }}
                            onClick={()=>{ match.showMore = !match.showMore; this.forceUpdate() }}>{ match.showMore ? 'less' : 'more'}</Grid>
                        </Grid>                
                      )                
                    })
                  }
                </Grid>      
              </Grid> 
            </Grid>
            <Grid container item xs={12} style={{ display: this.state.matches.length === 0 ? null : 'none' }}>
              <Grid xs={12} item style={{ padding: 24, textAlign: 'center' }}>No results found.</Grid>
            </Grid>        
          </Grid>
        </Grid>
      )
    }

}