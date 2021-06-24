import React from 'react'

import './App.css'

import { csv } from 'd3'

import CSVOfficeSeries from './data/the_office_series.csv'
import CSVOfficeLines from './data/the-office-lines-scripts.csv'

import TheOfficeWriters from './components/TheOffice-Writers.js'
import TheOfficeWords from './components/TheOffice-Words.js'
import TheOfficeLineSearch from './components/TheOffice-LineSearch.js'

import cleanUpLines from './lib/cleanUpLines.js'

export default class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      series: {},
      lines: {}
    }
  }

  componentDidMount () {
    csv(CSVOfficeSeries).then(series=>{
      csv(CSVOfficeLines).then(lines=>{
        // cleanUpLines(lines)
        lines = cleanUpLines(lines)
        this.setState({ series, lines })
      })
    })
  }

  render() {
    return (
      <div className="App">
        {/* <TheOfficeWriters seriesURL={CSVOfficeSeries}/> */}
        {/* <TheOfficeWords seriesURL={CSVOfficeSeries} linesURL={CSVOfficeLines}/> */}
        {/* <TheOfficeLineSearch seriesURL={CSVOfficeSeries} linesURL={CSVOfficeLines}/> */}
        <TheOfficeWriters series={this.state.series}/>
        <TheOfficeWords series={this.state.series} lines={this.state.lines}/>
        <TheOfficeLineSearch series={this.state.series} lines={this.state.lines}/>
      </div>
    )
  }  
}
