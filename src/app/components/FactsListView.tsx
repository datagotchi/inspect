"use client";

import React, { useContext, useState } from "react";

import { Fact, FactsListViewAction } from "../types";
import SelectedFactsButton from "./SelectedFactsButton";
import FactsDataContext from "../contexts/FactsDataContext";
import FactsTable from "./FactsTable";
import useUser from "../hooks/useUser";
import ServerActionContext from "../contexts/ServerActionContext";

const FactsListView = ({
  factName,
  selectedFacts,
  setSelectedFacts,
  unselectedActions,
  selectedActions,
  columns,
  hideHead,
  enableFeedback,
  cellActions,
}: {
  factName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serverFunctionInput?: any;
  selectedFacts: Fact[];
  setSelectedFacts: React.Dispatch<React.SetStateAction<Fact[]>>;
  unselectedActions?: FactsListViewAction[];
  selectedActions?: FactsListViewAction[];
  columns?: {
    name: string;
    dataColumn?: string;
    display: (fact: Fact) => React.JSX.Element;
  }[];
  hideHead?: boolean;
  enableFeedback?: boolean;
  cellActions?: {
    icon: string;
    label: string;
    onClick: (fact: Fact) => void;
    enabled?: (fact: Fact) => boolean;
  }[];
}): React.JSX.Element => {
  const { data, setData } = useContext(FactsDataContext);
  const [dataFilter, setDataFilter] = useState<string>("");
  const { loggedIn } = useUser();
  const serverActionContext = useContext(ServerActionContext);

  const HEADER_ELEMENT_ID = "factsLisActionstHeader";
  return (
    <>
      <div id={HEADER_ELEMENT_ID} className="content-card space-main">
        {(!selectedFacts || selectedFacts.length == 0) &&
          unselectedActions &&
          unselectedActions.length > 0 && (
            <div className="content-card-header">
              <div className="flex gap-4">
                {loggedIn &&
                  unselectedActions &&
                  unselectedActions
                    .filter((a) => a.enabled)
                    .map((unselectedAction, i) => (
                      <div key={`${factName} unselectedAction #${i}`}>
                        <SelectedFactsButton
                          classNames="btn btn-primary"
                          text={unselectedAction.text}
                          handleOnClick={() => {
                            unselectedAction.handleOnClick();
                            if (serverActionContext) {
                              // Input might be undefined for actions that don't need it
                              serverActionContext.executeAction(
                                unselectedAction.serverFunction,
                                {},
                              );
                            }
                          }}
                        />
                      </div>
                    ))}
              </div>
            </div>
          )}
        {selectedFacts &&
          selectedFacts.length > 0 &&
          selectedActions &&
          selectedActions.length > 0 && (
            <div className="content-card-header">
              <div className="flex gap-4">
                {loggedIn &&
                  selectedActions &&
                  selectedActions
                    .filter((a) => a.enabled)
                    .map((selectedAction, i) => (
                      <div key={`${factName} selectedAction #${i}`}>
                        <SelectedFactsButton
                          classNames={
                            selectedAction.className === "btn bg-danger"
                              ? "btn btn-danger"
                              : "btn btn-primary"
                          }
                          text={selectedAction.text}
                          handleOnClick={() => {
                            selectedAction.handleOnClick(selectedFacts);
                            if (serverActionContext) {
                              serverActionContext.executeAction(
                                selectedAction.serverFunction,
                                selectedFacts,
                              );
                            }
                            setSelectedFacts([]);
                          }}
                        />
                      </div>
                    ))}
              </div>
            </div>
          )}
        {data && data.length > 0 && (
          <div className="content-card-body">
            <FactsTable
              factName={factName}
              data={data}
              setData={setData}
              selectedFacts={selectedFacts}
              setSelectedFacts={setSelectedFacts}
              columns={columns}
              dataFilter={dataFilter}
              setDataFilter={setDataFilter}
              allowFeedback={true}
              theadTopCSS="100px"
              hideHead={hideHead}
              enableFeedback={enableFeedback}
              cellActions={cellActions}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default FactsListView;
