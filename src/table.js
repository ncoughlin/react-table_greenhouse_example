import React from "react";
import _ from "lodash";
import styled from "styled-components";
import classNames from "classnames";
import {
  useTable,
  useBlockLayout,
  useColumnOrder,
  useResizeColumns,
  useGlobalFilter,
  useSortBy,
  useExpanded
} from "react-table";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FixedSizeList } from "react-window";
import TableSearch from "./table_search";
import { compareAsc, parse } from "date-fns";
import { alphanumeric } from "./alphanumeric";

// Drag and drop animation styling
const getItemStyle = ({ isDragging, isDropAnimating }, draggableStyle) => {
  let styles = {
    ...draggableStyle,
    userSelect: "none",
    background: isDragging ? "#c8c8c8" : "none"
  };

  if (!isDragging) {
    styles = { ...styles, ...{ transform: "translate(0,0)" } };
  }

  if (isDropAnimating) {
    styles = { ...styles, ...{ transitionDuration: "0.001s" } };
  }

  return styles;
};

// This solution is based off of this example - https://react-table.tanstack.com/docs/examples/virtualized-rows
// Detecting and adding the scrollbar width to the totalColumnsWidth allows the table header columns to
// line up with the tbody columns. If we don't account for the scrollbar width,
// the table columns will be misaligned.
const scrollbarWidth = () => {
  const scrollDiv = document.createElement("div");
  scrollDiv.setAttribute(
    "style",
    "width: 100px; height: 100px; overflow: scroll; position:absolute; top:-9999px;"
  );
  document.body && document.body.appendChild(scrollDiv);
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body && document.body.removeChild(scrollDiv);
  return scrollbarWidth;
};

// Replace this data format based on your user's date format otherwise
// sorting by a date column wont work correctly.
const dateFormat = "mm/dd/yyyy";

const Table = (props) => {
  const { data, loading, columns, error } = props;
  console.log("props", props);

  const scrollBarSize = React.useMemo(() => scrollbarWidth(), []);
  const dataColumns = _.reject(columns, (col) => col.id === "row_number");
  const emptyReport = data.length === 0;

  // Checking whether the row number column already exists so that on re-renders,
  // or when the table data is updated, we don't add a duplicate row number column
  const addRowNumberColumn = () => {
    if (!_.find(columns, { id: "row_number" })) {
      columns.unshift({
        id: "row_number",
        width: 50,
        filterable: false,
        disableSortBy: true
      });
    }
  };

  columns.forEach((column) => {
    column.Cell = (cell) => {
      const hrefValue = cell.row.original.urls[cell.column.id];

      if (column.url && hrefValue) {
        return (
          <Link target="_blank" rel="noopener noreferrer" href={hrefValue}>
            <span>{cell.value}</span>
          </Link>
        );
      }

      return <span>{cell.value}</span>;
    };

    column.sortType = (a, b, columnId, desc) => {
      if (column.type === "date") {
        const valueA = a.values[columnId];
        const valueB = b.values[columnId];
        if (!valueA && !valueB) {
          return 0;
        }
        if (!valueA) {
          return desc ? -1 : 1;
        }
        if (!valueB) {
          return desc ? 1 : -1;
        }

        const dateA = parse(valueA, dateFormat, new Date());
        const dateB = parse(valueB, dateFormat, new Date());
        return compareAsc(dateA, dateB);
      }

      return alphanumeric(a, b, columnId);
    };
  });

  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 30,
      width: 150
    }),
    []
  );

  const firstColumn = dataColumns.length > 0 ? dataColumns[0] : {};
  const initialSortAccessor = {
    id: firstColumn.accessor
  };

  addRowNumberColumn();

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    allColumns,
    setColumnOrder,
    totalColumnsWidth,
    setGlobalFilter,
    state: { globalFilter }
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: { sortBy: [initialSortAccessor] }
    },
    useColumnOrder,
    useBlockLayout,
    useResizeColumns,
    useGlobalFilter,
    useSortBy,
    useExpanded
  );

  const dataIsNested = data.length !== rows.length;
  const currentColOrder = React.useRef();

  const rowBackgroundColor = (index, row) => {
    if (dataIsNested) {
      return row.subRows.length > 0 ? "grey" : "white";
    } else {
      return index % 2 === 0 ? "white" : "grey";
    }
  };

  const Row = (props) => {
    const { row, index, style = {} } = props;
    prepareRow(row);
    return (
      <tr
        {...row.getRowProps({
          style
        })}
        className={classNames("row", "body", rowBackgroundColor(index, row))}
      >
        {row.cells.map((cell, cellIndex) => {
          const rowNumberCell = cellIndex === 0;
          return (
            <td
              {...cell.getCellProps()}
              className={classNames("cell", { "row-number": rowNumberCell })}
            >
              {rowNumberCell ? index + 1 : cell.render("Cell")}
            </td>
          );
        })}
      </tr>
    );
  };

  const RenderRow = React.useCallback(
    ({ index, style }) => {
      const row = rows[index];
      return <Row index={index} row={row} style={style} />;
    },
    [prepareRow, rows]
  );

  if (loading) {
    return null;
  }

  return (
    <Styles>
      <TopSection>
        <TableSearch
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      </TopSection>
      <div className="tableWrap">
        <table className="react-table" {...getTableProps()}>
          {!emptyReport && (
            <thead>
              {headerGroups.map((headerGroup) => (
                <>
                  <DragDropContext
                    onDragStart={() => {
                      currentColOrder.current = allColumns.map((o) => o.id);
                    }}
                    onDragUpdate={(dragUpdateObj, b) => {
                      const colOrder = [...currentColOrder.current];
                      const sIndex = dragUpdateObj.source.index;
                      const dIndex =
                        dragUpdateObj.destination &&
                        dragUpdateObj.destination.index;

                      if (
                        typeof sIndex === "number" &&
                        typeof dIndex === "number"
                      ) {
                        colOrder.splice(sIndex, 1);
                        colOrder.splice(dIndex, 0, dragUpdateObj.draggableId);
                        setColumnOrder(colOrder);
                      }
                    }}
                  >
                    <Droppable droppableId="droppable" direction="horizontal">
                      {(droppableProvided) => (
                        <tr
                          ref={droppableProvided.innerRef}
                          className="row"
                          {...headerGroup.getHeaderGroupProps()}
                        >
                          {headerGroup.headers.map((column, index) => {
                            const sortByToggleProps = dataIsNested
                              ? {}
                              : column.getSortByToggleProps();
                            return (
                              <Draggable
                                key={column.id}
                                draggableId={column.id}
                                index={index}
                                isDragDisabled={!column.accessor}
                              >
                                {(provided, snapshot) => {
                                  return (
                                    <td
                                      {...column.getHeaderProps()}
                                      className={classNames("cell", "header", {
                                        "is-sorted": column.isSorted,
                                        "sort-asc": !column.isSortedDesc,
                                        "sort-desc": column.isSortedDesc,
                                        "can-sort": column.canSort
                                      })}
                                    >
                                      <HeaderCell
                                        {...sortByToggleProps}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        ref={provided.innerRef}
                                        style={{
                                          ...getItemStyle(
                                            snapshot,
                                            provided.draggableProps.style
                                          )
                                        }}
                                      >
                                        <div className="header-content">
                                          {column.render("Header")}
                                        </div>
                                      </HeaderCell>
                                      <div
                                        {...column.getResizerProps()}
                                        className={`resizer ${
                                          column.isResizing ? "isResizing" : ""
                                        }`}
                                      />
                                    </td>
                                  );
                                }}
                              </Draggable>
                            );
                          })}
                        </tr>
                      )}
                    </Droppable>
                  </DragDropContext>
                </>
              ))}
            </thead>
          )}

          <tbody className="rows" {...getTableBodyProps()}>
            {emptyReport && (
              <EmptyState>
                {error
                  ? "Sorry, we are unable to load a preview at this time."
                  : "No matching records found. Adjust your filters to see more results."}
              </EmptyState>
            )}

            {rows.length > 20 ? (
              <FixedSizeList
                height={800}
                itemCount={rows.length}
                itemSize={39}
                width={totalColumnsWidth + scrollBarSize}
              >
                {RenderRow}
              </FixedSizeList>
            ) : (
              rows.map((row, index) => <Row index={index} row={row} />)
            )}
          </tbody>

          {!emptyReport && (
            <ResultsContainer width={totalColumnsWidth}>
              <ResultsText>{`${data.length} result${
                data.length > 1 ? "s" : ""
              }`}</ResultsText>
            </ResultsContainer>
          )}
        </table>
      </div>
    </Styles>
  );
};

export default Table;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  height: 60px;
`;

const EmptyState = styled.div`
  padding: 80px 0px;
  text-align: center;
  font-size: 16px;
  color: #666666;
  border: 1px solid #e1e1e1;
  background-color: #fafafa;
  font-weight: 400;
`;

const ResultsContainer = styled.div`
  text-align: left;
  height: 39px;
  background: #fafafa;
  border-bottom: 1px solid #e1e1e1;
  border-left: 1px solid #e1e1e1;
  border-right: 1px solid #e1e1e1;
  width: ${({ width }) => `${width}px`};
`;

const ResultsText = styled.div`
  padding-left: 20px;
  padding-top: 9px;
`;

const HeaderCell = styled.div`
  padding: 0.7rem;
`;

const Link = styled.a`
  font-family: Untitled Sans, sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: #3574d6;
  font-weight: 400;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Styles = styled.div`
  display: block;
  max-width: 100%;

  .tableWrap {
    display: block;
    max-width: 100%;
    overflow-y: hidden;
  }

  table {
    width: 100%;
    border-spacing: 0;
    background-color: #f3f3f3;
    font-size: 14px;
    font-weight: 400;

    thead {
      tr:first-child {
        td {
          border-top: 1px solid #e1e1e1;
          font-size: 12px;
          padding: 0;
        }
      }

      tr {
        background: #fafafa;
        border-bottom: 1px solid #e1e1e1;
        border-right: 1px solid #e1e1e1;
        height: 39px;
        td {
          font-weight: 600;
          border-bottom: none;
          &.is-sorted.sort-asc {
            box-shadow: inset 0 3px 0 0 rgba(0, 0, 0, 0.6);
          }
          &.is-sorted.sort-desc {
            box-shadow: inset 0 -3px 0 0 rgba(0, 0, 0, 0.6);
          }
          &.can-sort {
            cursor: pointer;
          }
        }
      }
    }

    tbody {
      & > div {
        border-bottom: 1px solid #e1e1e1;
      }
      tr {
        background-color: #f3f3f3;
        &.grey {
          td {
            background-color: #fafafa;
          }
        }
        &.white {
          td {
            background-color: white;
          }
        }
        &:hover {
          td {
            background-color: #edf3fa;
          }
        }
        td:first-child {
          font-weight: 600;
        }
        td:last-child {
          border-right: 1px solid #e1e1e1;
        }
      }
    }

    th,
    td {
      margin: 0;
      border-bottom: 1px solid;
      border-right: 1px solid;
      border-color: #e1e1e1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 14px;
      padding: 0 5px 0 20px;
      padding: 0.7rem;
      font-weight: 400;

      width: 1%;
      &.collapse {
        width: 0.0000000001%;
      }

      &.row-number {
        padding-left: 10px;
        text-align: center;
      }
    }

    td:first-child {
      border-left: 1px solid #e1e1e1;
    }

    td:last-child {
      border-right: none;
    }
  }

  .cell {
    .resizer {
      display: inline-block;
      width: 10px;
      height: 100%;
      position: absolute;
      right: 0;
      top: 0;
      transform: translateX(50%);
      z-index: 1;
      touch-action: none;
    }
  }
`;
