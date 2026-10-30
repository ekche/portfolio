import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const title = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const sliceGenerator = d3.pie().value((d) => d.value);

// Fixed color per year so colors don't shift when filtering
const colors = d3.scaleOrdinal(d3.schemeTableau10)
  .domain([...new Set(projects.map((p) => String(p.year)))].sort().reverse());

// Shared state: BOTH filters live here (this is the Step 5.4 fix)
let query = '';
let selectedYear = null;

function toggleYear(label, focusSelector = null) {
  selectedYear = selectedYear === label ? null : label;
  applyFilters();
  // elements are re-created on each render, so restore keyboard focus
  if (focusSelector) document.querySelector(`${focusSelector}[data-label="${label}"]`)?.focus();
}

function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => String(d.year),
  ).sort((a, b) => b[0].localeCompare(a[0]));

  const data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((d) => arcGenerator(d));
  const selectedIndex = data.findIndex((d) => d.label === selectedYear);

  // clear old paths and legend items
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .attr('class', i === selectedIndex ? 'selected' : null)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-pressed', i === selectedIndex)
      .attr('aria-label', `${data[i].label}: ${data[i].value} projects`)
      .attr('data-label', data[i].label)
      .on('click', () => toggleYear(data[i].label))
      .on('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleYear(data[i].label, 'path');
        }
      });
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-pressed', i === selectedIndex)
      .attr('data-label', d.label)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => toggleYear(d.label))
      .on('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleYear(d.label, 'li');
        }
      });
  });
}

function applyFilters() {
  // 1. search filter (case-insensitive, across all metadata)
  const q = query.toLowerCase();
  const searched = projects.filter((project) =>
    Object.values(project).join('\n').toLowerCase().includes(q),
  );

  // 2. if the selected year vanished from the search results, deselect it
  if (selectedYear && !searched.some((p) => String(p.year) === selectedYear)) {
    selectedYear = null;
  }

  // 3. pie + legend reflect the search; the selected wedge narrows the list
  renderPieChart(searched);
  const visible = selectedYear
    ? searched.filter((p) => String(p.year) === selectedYear)
    : searched;

  renderProjects(visible, projectsContainer, 'h2');
  if (title) title.textContent = `${visible.length} Projects`;
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  applyFilters();
});

applyFilters(); // initial render on page load
