import React from 'react'
import * as d3 from 'd3'

export default class LoadingScreen extends React.Component {

    constructor (props) {
      super(props)
      this.state = {}
      this.svgRef = React.createRef()
      this.componentWillUnmountFlag = false
    }

    componentDidMount() {
      console.log('mounted')

      const w = 512
      const h = 512

      const svg = d3.select(this.svgRef.current)
        .attr('viewBox', [0,0,w,h].join(' '))
        .attr('width', '33%').attr('margin', 'auto')
        // .style('background-color', "#000")
        // .style('outline', '1px solid black')

      const color = d3.scaleOrdinal(d3.schemeCategory10)

      // const lg = svg.append('linearGradient').attr('id','clrs')
      const lg = svg.append('radialGradient').attr('id','clrs')      
      lg.append('stop').attr('offset', '0%').attr('stop-color', d3.schemeCategory10[3]).attr('stop-opacity', 1)
      lg.append('stop').attr('offset', '10%').attr('stop-color', d3.schemeCategory10[1]).attr('stop-opacity', .33)
      lg.append('stop').attr('offset', '100%').attr('stop-color', d3.schemeCategory10[0]).attr('stop-opacity', .0)
      // lg.append('stop').attr('offset', '0%').attr('stop-color', '#FFF')
      // lg.append('stop').attr('offset', '80%').attr('stop-color', d3.schemeCategory10[0])
      
      // lg.append('stop').attr('offset', '100%').attr('stop-color', '#FFF')
      

      const gCenter = svg.append('g').attr('transform', `translate(${w*0.5} ${h*0.5})`)
      
      const nCircle = 64
      
      const circles = d3.range(nCircle).map(n=>{
        return gCenter.append('circle').attr('opacity', 1).attr('fill', 'url(#clrs)')
      })

      const text = gCenter.append('text').attr('text-anchor','middle')
        .text('LOADING DATASETS').attr('letter-spacing',0).attr('fill', '#FFF')
        .attr('font-weight',700).attr('font-size',24)

      let index = 20
      const self = this
      function render () {
        const r = 90
        const t = index        
        const xMultiplier = Math.cos(t*.1)
        const yMulitplier = Math.cos(t*.2)
        const circleMultiplier = Math.cos(t*.001)
        const rMulti = .2
        circles.forEach((circle,circleIdx)=>{
          circle
          .attr('cx', xMultiplier * r * Math.cos(t+(circleIdx*circleMultiplier)))
          .attr('cy', yMulitplier * r * Math.sin(t+(circleIdx*circleMultiplier)))
          .attr('r', r + (64 * Math.abs(Math.sin((t*rMulti)+(circleIdx*circleMultiplier)))))
        })
        text.attr('letter-spacing', Math.max(5*Math.sin(index*0.5),0)).attr('opacity', Math.sin(index*0.5))
        // index += .0333
        index += 0.1
        // text.text(index)
        if(self.componentWillUnmountFlag === false) {
          requestAnimationFrame(render)
        }        
      }
      render()
    }

    componentWillUnmount () {
      this.componentWillUnmountFlag = true
    }

    render () {
      return (
        <div style={{ textAlign:'center' }}>
          <svg ref={this.svgRef}/>
        </div>
      )
    }

}