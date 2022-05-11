import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import Table from "./table";

const data = [
  {
    urls: {
      job_name: "/example_url",
      canddiates_added: "/url_example",
      candidates_hired: "/example_url"
    },
    job_name: "Software Engineer",
    department: "Engineering",
    open_date: "05/04/2020",
    candidates_added: 70,
    candidates_hired: 3
  },
  {
    urls: {
      job_name: "/example_url",
      canddiates_added: "/url_example",
      candidates_hired: "/example_url"
    },
    job_name: "Data Engineer",
    department: "Data",
    open_date: "09/15/2020",
    candidates_added: 25,
    candidates_hired: 0
  },
  {
    urls: {
      job_name: "/example_url",
      canddiates_added: "/url_example",
      candidates_hired: "/example_url"
    },
    job_name: "Senior Software Engineer",
    department: "Engineering",
    open_date: "09/28/2020",
    candidates_added: 50,
    candidates_hired: 2
  },
  {
    urls: {
      job_name: "/example_url",
      canddiates_added: "/url_example",
      candidates_hired: "/example_url"
    },
    job_name: "Data Scientist",
    department: "Data",
    open_date: "04/20/2020",
    candidates_added: 20,
    candidates_hired: 1
  },
  {
    urls: {
      job_name: "/example_url",
      canddiates_added: "/url_example",
      candidates_hired: "/example_url"
    },
    job_name: "Operations Manager",
    department: "Operations",
    open_date: "09/22/2020",
    candidates_added: 35,
    candidates_hired: 1
  }
];

const columns = [
  {
    label: "Job Name",
    Header: "Job Name",
    accessor: "job_name",
    type: "string",
    url: true,
    width: 300
  },
  {
    label: "Department",
    Header: "Department",
    accessor: "department",
    type: "string",
    url: false
  },
  {
    label: "Open Date",
    Header: "Open Date",
    accessor: "open_date",
    type: "date",
    url: false
  },
  {
    label: "Candidates Added",
    Header: "Candidates Added",
    accessor: "candidates_added",
    type: "string",
    url: true
  },
  {
    label: "Candidates Hired",
    Header: "Candidates Hired",
    accessor: "candidates_hired",
    type: "string",
    url: true
  }
];

ReactDOM.render(
  <Table data={data} columns={columns} error />,
  document.getElementById("root")
);
