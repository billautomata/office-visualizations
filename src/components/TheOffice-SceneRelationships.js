import React from 'react'
import * as d3 from 'd3'

export default class OfficeSceneRelationship extends React.Component {

    constructor (props) {
      super(props)
      this.state = {}
      this.svgRef = React.createRef()
      this.graphDrawn = false
    }

    componentDidMount() {
      console.log('mounted')

      this.w = 1024
      this.h = 768

      const svg = d3.select(this.svgRef.current)
        .attr('viewBox', [0,0,this.w,this.h].join(' '))
        .attr('width', this.w)        
        .style('font-family', 'Roboto')
    }

    componentDidUpdate () {
      console.log('component did update')
      if(this.props.lines.length === undefined ||
        this.graphDrawn === true) {
        return
      }      
      this.graphDrawn = true

      const svg = d3.select(this.svgRef.current)
      const nCharacters = 24

      // find all the scenes and note which characters appear
      console.log(this.props.lines.length)
      console.log(this.props.lines[0])

      const scenes = {}
      const characters = {}

      this.props.lines.forEach(line=>{
        const SES = `S${line.season}E${line.episode}S${line.scene}`
        if(scenes[SES] === undefined) {
          scenes[SES] = []
        }
        if(scenes[SES].indexOf(line.speaker) === -1) {
          scenes[SES].push(line.speaker)
        }
        if(characters[line.speaker] === undefined) {
          characters[line.speaker] = 0
        }
        characters[line.speaker] += 1
      })

      console.log(scenes, Object.values(scenes).length)
      const topCharacters = toArray(characters)
        .sort((a,b)=>{return b.value - a.value})
        .slice(0,nCharacters)
      
      const topCharacterNames = topCharacters.map(o=>{return o.name})

      const relationships = {}

      topCharacterNames.forEach(character=>{
        relationships[character] = { total: 0 }
        Object.values(scenes).forEach(scene=>{
          // determine if this scene has the character we are building stats for
          if(scene.indexOf(character) === -1) {
            return
          }
          if(scene.length > 1) {
            relationships[character].total += 1
          }
          scene.forEach(otherCharacter=>{
            // determine if this other character is a top character
            if(topCharacterNames.indexOf(otherCharacter) === -1) {
              return
            }
            // determine if this other character is this character
            if(character === otherCharacter) {
              return
            }
            if(relationships[character][otherCharacter] === undefined) {
              relationships[character][otherCharacter] = 0
            }
            relationships[character][otherCharacter] += 1
          })
        })
      })

      console.log(relationships)

      // this.circlePack({relationships, svg})
      this.radialGraph({relationships, svg})
      // this.forceDirectedGraph({relationships, svg})
    }

    radialGraph(o) {

      // params to tweak
      const defaultOpacity = 0.75
      const fadedOpacity = 0.0
      const r0 = this.h*0.4
      const r1 = this.h*0.45     
      const iR = .33

      // hardcoded params, leave alone
      const arcOffset = Math.PI*0.5

      // graph functions
      const color = d3.scaleOrdinal(d3.schemeTableau10)
      const lineFn = d3.line().x(d=>d.x).y(d=>d.y).curve(d3.curveBasis)
      const arcFn = d3.arc().innerRadius(r0).outerRadius(r1).cornerRadius(5)
      const pie = d3.pie().sort((a,b)=>{return b.total - a.total}).value(d=>d.total)

      // register of elements that change when the interactions happen
      const paths = {}
      const texts = {}

      // graphing begins
      const gLocal = o.svg.append('g').attr('transform', `translate(${this.w*0.5} ${this.h*0.5})`)
      const gPaths = gLocal.append('g')

      const arcs = pie(Object.values(o.relationships).sort((a,b)=>{return b.total - a.total}))
      arcs.forEach(arc=>{arc.startAngle -= arcOffset; arc.endAngle -= arcOffset})
      console.log('arcs', arcs)

      Object.keys(o.relationships).forEach(name=>{o.relationships[name].name = name})

      gLocal.selectAll('path')
        .data(arcs).enter()  
        .append('path')
        .attr('class', 'character-arc')
        .attr('id', d=>{ return d.data.name })
        .attr('d', arcFn)
        .attr('fill', (d,i)=>color(Number(i)))
        .attr('stroke', '#FFF')
        .on('mouseover', (event,d)=>{
          console.log(event)
          console.log(d)  
          highlightOne(d.data.name)          
        })
        .on('mouseout', (event,d)=>{
          touchAll(1)
        })

      function touchAll (v) {
        Object.values(paths).forEach(pathGroup=>{
          // console.log(pathGroup)
          pathGroup.forEach(path=>{
            path.attr('opacity', v)
          })
        })
        Object.values(texts).forEach(text=>{
          text.select('tspan').text(text.datum().total)
        })
      }

      function highlightOne (name) {
        touchAll(fadedOpacity)
        gLocal.select(`path.character-arc#${name}`).attr('opacity', 1)
        paths[name].forEach(path=>{
          path.attr('opacity', 1)
        })
        Object.values(texts).forEach(text=>{
          const v = o.relationships[name][text.datum().name]
          if(text.datum().name === name) { return }
          text.select('tspan').text(v === undefined ? 0 : v)
        })
      }

      const arcDataShiftLimit = 160
      const r = r0 * 1.05
      let r2 = r1 * 1.05

      arcs.forEach((arcData,arcDataIndex)=>{
        const midAngle = arcData.startAngle + 0.5*(arcData.endAngle - arcData.startAngle) - (Math.PI*0.5)
        const pt0 = { x: r*Math.cos(midAngle), y: r*Math.sin(midAngle) }
        const pt1 = { x: r2*Math.cos(midAngle), y: r2*Math.sin(midAngle) }

        const scaleRotation = d3.scaleLinear().domain([0,Math.PI*2]).range([0,360])
        let rotation = arcDataIndex < arcDataShiftLimit ? 0 : scaleRotation(midAngle) + (midAngle > Math.PI/2 ? 180 : 0)

        let textAnchor = midAngle > Math.PI/2 ? 'end' : 'start'
        if(arcDataIndex < 2) { textAnchor = 'end' }
        if(arcData.data.name === 'Ryan' || 
          arcData.data.name === 'Erin' || 
          arcData.data.name === 'Phyllis') {
          textAnchor = 'middle'
        }

        texts[arcData.data.name] = gLocal.append('text').text(`${arcData.data.name} - `)
          .attr('id', `${arcData.data.name}`)
          .datum({ total: arcData.data.total, name: arcData.data.name })
          .attr('transform', `translate(${pt1.x} ${pt1.y}) rotate(${rotation})`)
          .attr('x', 0).attr('y', 0).attr('dy', '.33em')
          .attr('text-anchor', textAnchor).attr('font-size', 16)
          .attr('font-weight', 300)
        
        texts[arcData.data.name].append('tspan').text(`${arcData.data.total}`).attr('dy','-1px')
          .attr('font-size', 12).attr('font-weight',600)
      })

      arcs.forEach((arcData, arcIndex)=>{      

        paths[arcData.data.name] = []

        let sum = 0 
        const arcDistance = arcData.endAngle-arcData.startAngle                
        Object.keys(arcData.data).filter(o=>{return o !== 'name' && o !== 'total'}).forEach(name=>{ sum+= arcData.data[name] })
        const arcScale = d3.scaleLinear().domain([0,sum]).range([0,arcDistance*0.99])        

        let runningAngle = 0
        toArray(arcData.data).sort((a,b)=>{return a.value - b.value }).forEach((v,otherArcIdx)=>{
          if(v.name === 'name' || v.name === 'total') { return}
          runningAngle += arcScale(arcData.data[v.name]) * 0.5
          // draw lines from each segment to the corresponding segment 
          const otherArc = arcs.filter(o=>{return o.data.name === v.name})[0]
          const midAngle = otherArc.startAngle + 0.5*(otherArc.endAngle - otherArc.startAngle) - (Math.PI*0.5)
          const pts = [
            { x: r * Math.cos(arcData.startAngle - (Math.PI*0.5) + runningAngle), y: r * Math.sin(arcData.startAngle - (Math.PI*0.5) + runningAngle)},
            { x: iR * r * Math.cos(arcData.startAngle - (Math.PI*0.5) + runningAngle), y: iR * r * Math.sin(arcData.startAngle - (Math.PI*0.5) + runningAngle)},
            { x: iR * r * Math.cos(midAngle), y: iR * r * Math.sin(midAngle) },
            { x: r * Math.cos(midAngle), y: r * Math.sin(midAngle) },
          ]
          const path = gPaths.append('path').datum(pts).attr('d', lineFn).attr('fill', 'none')
            .attr('stroke', color(Number(otherArc.index)))
            .attr('stroke-width', Math.max(1,arcScale(arcData.data[v.name]) * this.w * 0.333333))
            .attr('stroke-opacity', 0.75).attr('pathLength',1).attr('stroke-dasharray', '0 1')
          
          path.transition().delay((otherArcIdx+arcIndex)*30).duration(1000).attr('stroke-dasharray', '1 0')
          runningAngle += arcScale(arcData.data[v.name]) * 0.5
          
          paths[arcData.data.name].push(path)
        })
      })

      console.log('texts', texts)

    }

    forceDirectedGraph(o) {

      const relationships = o.relationships
      const svg = o.svg

      const nodes = Object.keys(relationships).map(n=>{ return { id: n }})
      const links = []
      Object.keys(relationships).forEach(name=>{
        const o = relationships[name]
        Object.keys(o).filter(o=>{return o !== 'total'}).forEach(character=>{
          const sharedScenes = o[character]
          if(links.filter(o=>{ return o.source === character && o.target === name }).length === 0) {
            links.push({ source: name, target: character, value: sharedScenes })
          }
        })
      })
      console.log(links)

      const max = d3.max(Object.values(relationships), d=>d.total)
      const min = d3.min(Object.values(relationships), d=>d.total)
      console.log('max', max)

      const distanceScale = d3.scaleLinear().domain([min,max]).range([300,10])

      const force = d3.forceLink(links)
        .id(d=>d.id)
        .distance(d=>distanceScale(d.value))
        // .strength(d=>.9)

      const simulation = d3.forceSimulation(nodes)
        .force('link', force)
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(this.w*0.5, this.h*0.5))

      const link = svg.append("g")
          .attr("stroke", "#999")
          // .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
          // .attr("stroke-width", d => Math.sqrt(d.value));
    
      const node = svg.append("g")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
          .attr("r", 5)
          .attr("fill", 'green')
          // .call(drag(simulation));      

      simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
      })          

    }

    circlePack(o) {
      const relationships = o.relationships
      const svg = o.svg

      const color = d3.scaleOrdinal(d3.schemeTableau10)

      const data = { name: '', children: [] }
      Object.keys(relationships).forEach(name=>{
        const o = relationships[name]
        const p = {}
        p.name = name
        p.value = o.total 
        p.relationships = []
        Object.keys(o).filter(o=>{return o !== 'total'}).forEach(character=>{
          p.relationships.push({ name: character, value: o[character] })
        })
        data.children.push(p)
      })

      console.log(data)

      const pack = d3.pack()
        .size([this.w,this.h])
        .padding(10)(
          d3.hierarchy(data)
          .sum(d=>d.value)
          .sort((a,b)=> b.value-a.value)
        )

      console.log(pack)

      const gParent = svg.append('g')//.attr('transform', `translate(${this.w*0.5} ${this.h*0.5})`)

      pack.children.forEach((child,childIndex)=>{
        const gLocal = gParent.append('g').attr('transform', `translate(${child.x} ${child.y})`)
        gLocal.append('circle')
          .attr('cx',0).attr('cy',0).attr('r', child.r)
          .attr('fill', color(childIndex))

        gLocal.append('text').text(child.data.name)
          .attr('x',0).attr('y',0)//.attr('dy', '-0.33em')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .attr('font-size', 16)
          .attr('font-weight', 500).attr('letter-spacing', 1)
        gLocal.append('text').text(child.data.value)
          .attr('x',0).attr('y',0).attr('dy', '1.1em')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('fill', '#000')
          .attr('font-size', 14)
          .attr('font-weight', 300)//.attr('letter-spacing', 1)

        child.data.relationships.forEach(relationship=>{

        })
        

      })      
    }


    render () {
      return (
        <div style={{paddingTop: 20}}>
          <svg ref={this.svgRef}/>
        </div>
      )
    }

}

function toArray(object) {
  return Object.keys(object).map(o=>{
    return { name: o, value: object[o] }
  })
}