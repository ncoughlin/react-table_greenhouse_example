import React from "react";
import styled from "styled-components";
import TextField from "@material-ui/core/TextField";

const TableSearch = ({ globalFilter, setGlobalFilter }) => {
  return (
    <SearchBarContainer>
      <SearchBar>
        <StyledInput
          value={globalFilter || ""}
          onChange={(e) => {
            setGlobalFilter(e.currentTarget.value || undefined); // Set undefined to remove the filter entirely
          }}
          placeholder="Search Report"
        />
      </SearchBar>
    </SearchBarContainer>
  );
};

export default TableSearch;

const SearchBarContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: 10px;
`;

const SearchBar = styled.div`
  display: flex;
  width: 400px;
`;

const StyledInput = styled(TextField)`
  font-family: "Untitled Sans", sans-serif;
  height: 36px;
`;
