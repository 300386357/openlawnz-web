import React, { Component } from "react";
import memoize from "fast-memoize";
import { Link } from "react-router-dom";

import dateFormat from "date-fns/format";
import parseISO from "date-fns/parseISO";
import ReactPaginate from "react-paginate";
import InfoCard from "../components/InfoCard.jsx";

import SearchIcon from "-!svg-react-loader?name=Logo!../../img/search-icon.svg";
import Next from "-!svg-react-loader?name=Logo!../../img/next-page.svg";
import Previous from "-!svg-react-loader?name=Logo!../../img/previous-page.svg";
import Exclamation from "-!svg-react-loader?name=Logo!../../img/exclamation.svg";

const queryString = require("query-string");
const memoizedFetch = memoize((query, offset, end) =>
	fetch(`https://search.openlaw.nz/cases?search=${query}&start=${offset}&end=${end}`)
);

const Results = ({ data = [] }) =>
	data.map((result, index) => (
		<tr key={index}>
			<td className="caseName">
				<Link to={`/case/${result.caseId}`}>{result.caseName}</Link>
			</td>
			<td>{result.citation === null ? "N / A" : result.citation}</td>
			<td className="caseDate">{dateFormat(parseISO(result.date), "dd/MM/yyyy")}</td>
		</tr>
	));

const NoResults = () => (
	<tr>
		<td className="caseName">-------</td>
		<td>-------</td>
		<td className="caseDate">-------</td>
	</tr>
);

const Search = ({ searchMsg, showSearchMsg, value, onSubmit, onInputChange }) => (
	<div className="search-container">
		<div className="search">
			<form className="search-input" onSubmit={onSubmit}>
				<div className="input-wrapper">
					<label className="search-label" htmlFor="searchTerm">
						Search legal cases
					</label>
					<input
						id="searchTerm"
						type="text"
						className="search-term"
						placeholder="Search legal cases"
						onChange={onInputChange}
						defaultValue={value}
					/>
					<button type="submit" className="search-button" title="Search">
						<SearchIcon />
					</button>
				</div>
				<button type="submit" className="search-submit-button">
					Search
				</button>
			</form>
		</div>
		{showSearchMsg ? (
			<div className="search-msg">
				<Exclamation />
				<p>{searchMsg}</p>
			</div>
		) : null}
	</div>
);

const Pagination = ({ onPageChange, pageCount, currentPage }) => (
	<div className="page-number">
		<ReactPaginate
			previousLabel={<Previous />}
			nextLabel={<Next />}
			breakLabel={"..."}
			breakClassName={"break-me"}
			pageCount={pageCount}
			forcePage={currentPage}
			marginPagesDisplayed={1}
			pageRangeDisplayed={window && window.innerWidth < 450 ? 2 : 4} // Fewer items provide better view on mobile
			onPageChange={onPageChange}
			containerClassName={"pagination"}
			subContainerClassName={"pages pagination"}
			activeClassName={"active"}
		/>
	</div>
);

class SearchPage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			currentSearchQuery: queryString.parse(props.location).q,
			query: "",
			results: [],
			perPage: 10,
			offset: 0,
			currentPage: 0,
			length: 0,
			pageCount: 0,
			searchInProgress: true,
			paginationInProgress: false
		};
		this.handlePageClick = this.handlePageClick.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

	doSearch(query, offset) {
		return memoizedFetch(query, offset, offset + this.state.perPage).then(results => {
			results
				.clone() // Necessary because of memoization of fetch
				.json()
				.then(data => {
					// Check if is mounted to avoid performance issues with unmounted setState
					if (this._isMounted) {
						this.setState({
							results: data.results,
							length: parseInt(data.total),
							pageCount: parseInt(data.total) / this.state.perPage,
							paginationInProgress: false,
							searchInProgress: false
						});
					}
				});
		});
	}

	handlePageClick(data) {
		const selected = data.selected;
		const offset = selected * this.state.perPage;

		this.setState({ offset: offset, currentPage: selected, paginationInProgress: true }, () => {
			this.doSearch(this.state.currentSearchQuery, this.state.offset);
		});
	}

	handleSubmit(e) {
		e.preventDefault();
		if (this.state.query === "") {
			this.setState({
				searchMsg: "Please enter a new search term",
				showSearchMsg: true
			});
		} else {
			this.props.history.replace(`/search?q=${this.state.query}`);
			this.setState({
				currentPage: 0,
				query: "",
				currentSearchQuery: this.state.query,
				searchInProgress: true,
				showSearchMsg: false
			});
			this.doSearch(this.state.query, 0);
		}
	}

	handleChange(e) {
		this.setState({ query: e.target.value });
	}

	componentDidMount() {
		const searchQuery = queryString.parse(location.search);
		this._isMounted = true;
		this.doSearch(searchQuery.q, this.state.offset);
		if (searchQuery.q) {
			this.setState({
				currentSearchQuery: searchQuery.q
			});
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	render() {
		if (!this.state.currentSearchQuery) {
			return <p className="loading-text">Loading</p>;
		}
		return (
			<React.Fragment>
				<div className="highlighted-content">
					<Search
						value={this.state.currentSearchQuery}
						onSubmit={this.handleSubmit}
						onInputChange={this.handleChange}
						showSearchMsg={this.state.showSearchMsg}
						searchMsg={this.state.searchMsg}
					/>
					<InfoCard classModifier="info-card--large info-card--title info-card--column">
						{this.state.searchInProgress ? (
							<span>
								SEARCHING RESULTS FOR <b>{`"${this.state.currentSearchQuery.toUpperCase()}"`}</b>
							</span>
						) : (
							<React.Fragment>
								<h1>{this.state.length}</h1>
								<span>
									SEARCH RESULTS FOR <b>{`"${this.state.currentSearchQuery.toUpperCase()}"`}</b>
								</span>
							</React.Fragment>
						)}
					</InfoCard>
				</div>
				<div className="home-wrapper">
					<div className="container">
						{this.state.length >= this.state.perPage && (
							<Pagination
								onPageChange={this.handlePageClick}
								currentPage={this.state.currentPage}
								pageCount={this.state.pageCount}
							/>
						)}
						<table className="table">
							<thead>
								<tr>
									<th>Case Name</th>
									<th>Citation</th>
									<th>Date</th>
								</tr>
							</thead>
							<tbody
								className={
									this.state.paginationInProgress || this.state.searchInProgress
										? "loading"
										: undefined
								}
							>
								{this.state.length === 0 ? <NoResults /> : <Results data={this.state.results} />}
							</tbody>
						</table>
						{this.state.length >= this.state.perPage && (
							<Pagination
								onPageChange={this.handlePageClick}
								currentPage={this.state.currentPage}
								pageCount={this.state.pageCount}
							/>
						)}
					</div>
				</div>
			</React.Fragment>
		);
	}
}

export default SearchPage;
