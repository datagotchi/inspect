"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import cardStyles from "../../styles/components/card.module.css";

import {
  FLVResponse,
  Fact,
  FactsListViewAction,
  ServerFunction,
} from "../types";
import SelectedFactsButton from "./SelectedFactsButton";
import FactsDataContext from "../contexts/FactsDataContext";
import FactsTable from "./FactsTable";
import useUser from "../hooks/useUser";

const HEADER_ELEMENT_ID = "factsLisActionstHeader";

const FactsListView = ({
  factName,
  serverFunctionInput,
  setServerFunctionInput,
  selectedFacts,
  setSelectedFacts,
  unselectedActions,
  unselectedActionsContainerId,
  selectedActions,
  columns,
  setActiveServerFunction,
  activeServerFunction,
  hideHead,
  enableFeedback,
  cellActions,
}: {
  factName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serverFunctionInput?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setServerFunctionInput: React.Dispatch<React.SetStateAction<any | undefined>>;
  selectedFacts: Fact[];
  setSelectedFacts: React.Dispatch<React.SetStateAction<Fact[]>>;
  unselectedActions?: FactsListViewAction[];
  unselectedActionsContainerId?: string;
  selectedActions?: FactsListViewAction[];
  columns?: {
    name: string;
    dataColumn?: string;
    display: (fact: Fact) => React.JSX.Element;
  }[];
  setActiveServerFunction: React.Dispatch<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.SetStateAction<{ function: ServerFunction<any> } | undefined>
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeServerFunction: { function: ServerFunction<any> } | undefined;
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
  const [flvResponses, setFLVResponses] = useState<FLVResponse[]>([]);
  const [dataFilter, setDataFilter] = useState<string>("");
  const [unselectedActionsContainer, setUnselectedActionsContainer] =
    useState<HTMLElement | null>(null);

  const { token } = useUser();

  const updateExistingFact = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (uid: string, newFact: { [x: string]: any }) => {
      const foundFact = data?.find((fact) => fact.uid == uid);
      if (foundFact) {
        Object.keys(newFact).forEach((key) => {
          if (key == "is_public") {
            foundFact[key] = newFact[key];
          } else if (key == "citations") {
            foundFact[key] = [...foundFact[key], ...newFact[key]];
          }
        });
      }
    },
    [data],
  );

  /* executing server functions when input is specified */
  useEffect(() => {
    if (serverFunctionInput && activeServerFunction && token) {
      activeServerFunction
        .function(serverFunctionInput, token)
        .then((response: FLVResponse | FLVResponse[] | void) => {
          if (Array.isArray(response)) {
            setFLVResponses([...flvResponses, ...response]);
          } else if (response) {
            setFLVResponses([...flvResponses, response]);
          }
        });
      setServerFunctionInput(undefined);
      setActiveServerFunction(undefined);
    }
  }, [
    activeServerFunction,
    flvResponses,
    serverFunctionInput,
    setFLVResponses,
    setActiveServerFunction,
    token,
    setServerFunctionInput,
  ]);

  /* updating the flv container from responses */
  useEffect(() => {
    while (flvResponses && flvResponses.length > 0) {
      const response = flvResponses.pop();
      if (response) {
        try {
          if (response.action == -1) {
            if (response.facts[0].uid) {
              const uids = response.facts.map((f) => f.uid);
              if (data) {
                setData(data.filter((item) => !uids.includes(item.uid)));
              }
            } else {
              const ids = response.facts.map((f) => f.id);
              if (data) {
                setData(data.filter((item) => !ids.includes(item.id)));
              }
            }
            setDataFilter("");
          } else if (response.action == 0) {
            response.facts.forEach((f) => {
              if (f.uid) {
                updateExistingFact(f.uid, f);
              }
            });
            if (data) {
              setData([...data]);
            }
          } else if (response.action == 1) {
            if (data) {
              setData([...response.facts, ...data]);
            }
          }
        } catch (err) {
          alert("Error: " + err);
          console.error("Error: ", err);
        } finally {
          setSelectedFacts([]);
          setServerFunctionInput(undefined);
          setActiveServerFunction(undefined);
        }
      }
    }
  }, [
    flvResponses,
    data,
    setActiveServerFunction,
    setData,
    setSelectedFacts,
    setServerFunctionInput,
    updateExistingFact,
  ]);

  const unselectedActionsButtons = unselectedActions &&
    unselectedActions.length > 0 && (
      <div className="content-card-header">
        <div className="flex gap-4">
          {unselectedActions
            .filter((a) => a.enabled)
            .map((unselectedAction, i) => (
              <div key={`${factName} unselectedAction #${i}`}>
                <SelectedFactsButton
                  classNames={cardStyles.addButton}
                  text={unselectedAction.text}
                  icon={unselectedAction.icon}
                  handleOnClick={() => {
                    unselectedAction.handleOnClick();
                    if (unselectedAction.serverFunction) {
                      // saving the function directly calls it, so wrapping it in an object
                      setActiveServerFunction({
                        function: unselectedAction.serverFunction,
                      });
                    }
                  }}
                />
              </div>
            ))}
        </div>
      </div>
    );

  useEffect(() => {
    if (unselectedActionsContainerId) {
      const containerElement = document.getElementById(
        unselectedActionsContainerId,
      );
      if (containerElement) {
        setUnselectedActionsContainer(containerElement);
      }
    } else {
      const containerElement = document.getElementById(
        "flvUnselectedActionsContainer",
      );
      if (containerElement) {
        setUnselectedActionsContainer(containerElement);
      }
    }
  }, [unselectedActionsContainerId]);

  return (
    <>
      {unselectedActionsContainer &&
        createPortal(unselectedActionsButtons, unselectedActionsContainer)}
      <div id={HEADER_ELEMENT_ID} className="content-card space-main">
        <div id="flvUnselectedActionsContainer"></div>
        <div className="content-card-header">
          <div
            className="flex gap-4"
            style={{
              justifyContent: "center",
              height: "31px",
              marginBottom: "15px",
            }}
          >
            {selectedActions &&
              selectedActions.length > 0 &&
              selectedFacts &&
              selectedFacts.length > 0 &&
              selectedActions
                .filter((a) => a.enabled)
                .map((selectedAction, i) => (
                  <div key={`${factName} selectedAction #${i}`}>
                    <SelectedFactsButton
                      classNames={cardStyles.addButton}
                      text={selectedAction.text}
                      icon={selectedAction.icon}
                      handleOnClick={() => {
                        selectedAction.handleOnClick(selectedFacts);
                        if (selectedAction.serverFunction) {
                          // saving the function directly calls it, so wrapping it in an object
                          setActiveServerFunction({
                            function: selectedAction.serverFunction,
                          });
                        }
                        setSelectedFacts([]);
                      }}
                    />
                  </div>
                ))}
          </div>
        </div>
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
