import React, { useState } from "react";

import ListBox from "./ListBox.jsx";
import useDebouncedFetch from "./useDebouncedFetch.jsx";

const CaseName = ({ value, id, onChange, className, isPopulated }) => {
	const [name, setName] = useState(value.title || "");
	const { results: titleResults } = useDebouncedFetch({
		source: "http://localhost:8085/cases/names?search=",
		term: name,
		extraParams: "&start=0&end=5"
	});
	const onValueChange = value => {
		setName(value);
		onChange({ id, value });
	};

	return (
		<div className={className}>
			<ListBox
				id={`case-title-${id}`}
				value={name}
				automatic={false}
				isPopulated={isPopulated}
				results={titleResults}
				textSelection={result => result.caseName}
				onInputValueChange={value => onValueChange(value)}
				onSelection={({ caseName = "" }) => onValueChange(caseName)}
			/>
		</div>
	);
};

export default CaseName;
