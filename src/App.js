import React from 'react'
import {
  HashRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import './App.css'

import { csv } from 'd3'

import CSVOfficeSeries from './data/the_office_series.csv'
import CSVOfficeLines from './data/the-office-lines-scripts.csv'

import TheOfficeWriters from './components/TheOffice-Writers.js'
import TheOfficeWords from './components/TheOffice-Words.js'
import TheOfficeLineSearch from './components/TheOffice-LineSearch.js'
import TheOfficeSceneRelationships from './components/TheOffice-SceneRelationships.js'

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
        lines = cleanUpLines(lines)
        this.setState({ series, lines })
      })
    })
  }

  render() {
    return (
      <Router> 
        <div className="App">
          <Switch>
            <Route exact path='/relationships'>
              <TheOfficeSceneRelationships lines={this.state.lines}/>
            </Route>
            <Route exact path='/writers'>
              <>
                <TheOfficeWriters series={this.state.series}/>
                {/* <TheOfficeWords series={this.state.series} lines={this.state.lines}/> */}
              </>
            </Route>
            <Route exact path='/quote-search'>
              <TheOfficeLineSearch series={this.state.series} lines={this.state.lines}/>
            </Route>     
            <Route path='/'>
              <div>Foo</div>
            </Route>
          </Switch>       
        </div>
      </Router>      
    )
  }  
}
