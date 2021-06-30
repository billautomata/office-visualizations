import { render, screen, within } from '@testing-library/react';
import App from './App';
import TheOfficeLineSearch from './components/TheOffice-LineSearch.js'
import SeriesData from './data/the_office_series.csv'
import { csv } from 'd3'

const mockLines = [
  {"id":"1","season":"1","episode":"1","scene":"1","line_text":"test","speaker":"Michael","deleted":"FALSE","search_text":"that's what she said"},
  {"id":"2","season":"1","episode":"1","scene":"1","line_text":"test","speaker":"Michael","deleted":"FALSE","search_text":"fake line"}
]

const mockSeries = [
  {"index":"0","Season":"1","EpisodeTitle":"Pilot","About":"The premiere episode introduces the boss and staff of the Dunder-Mifflin Paper Company in Scranton, Pennsylvania in a documentary about the workplace.","Ratings":"7.5","Votes":"4936","Viewership":"11.2","Duration":"23","Date":"24 March 2005","GuestStars":"","Director":"Ken Kwapis","Writers":"Ricky Gervais | Stephen Merchant | Greg Daniels"}  
]

test('results found is correct', () => {
  render(<TheOfficeLineSearch lines={mockLines} series={mockSeries}/>);
  const resultsFound = screen.getByTestId('results-found')
  expect(resultsFound.innerHTML).toEqual('<b>1</b> results found')
});
