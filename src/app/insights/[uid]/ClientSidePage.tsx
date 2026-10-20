"use client";

import styles from "@/styles/components/insight-detail-page.module.css";
import React, { useMemo } from "react";
import Link from "next/link";

import { Insight, User } from "../../types";
import RadialNetwork from "../../components/RadialNetwork";
import CurrentUserContext from "../../contexts/CurrentUserContext";

interface InsightDetailPageProps {
  insight: Insight | undefined | null;
  currentUser: User | null;
}

const ClientSidePage = ({
  insight,
  currentUser,
}: InsightDetailPageProps): React.JSX.Element => {
  // Scoped neighborhood graph: center node + direct parents + direct children
  const localGraphData = useMemo(() => {
    if (!insight) return [];

    const map = new Map<string, Insight>();

    if (insight.uid) {
      map.set(insight.uid, insight);
    }

    if (insight.children && insight.children.length > 0) {
      for (const link of insight.children) {
        const child = link.childInsight;
        if (child && child.uid && !map.has(child.uid)) {
          map.set(child.uid, child);
        }
      }
    }

    if (insight.parents && insight.parents.length > 0) {
      for (const link of insight.parents) {
        const parent = link.parentInsight;
        if (parent && parent.uid && !map.has(parent.uid)) {
          map.set(parent.uid, parent);
        }
      }
    }

    return Array.from(map.values());
  }, [insight]);

  if (!insight) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.mainContent}>
          <nav className={styles.navHeader}>
            <Link href="/insights" className={styles.backButton}>
              ← Back to Insights
            </Link>
          </nav>
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Insight Not Found</h2>
            <p className={styles.emptyCopy}>
              The insight you are looking for does not exist or could not be
              loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const citationCount = insight.evidence?.length ?? 0;
  const childCount = insight.children?.length ?? 0;
  const parentCount = insight.parents?.length ?? 0;

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className={styles.pageContainer}>
        <div className={styles.mainContent}>
          <nav className={styles.navHeader}>
            <Link href="/insights" className={styles.backButton}>
              ← Back to Insights
            </Link>
          </nav>

          <header className={styles.insightHeader}>
            <p className={styles.pageEyebrow}>Insight Details</p>
            <h1 className={styles.insightTitle}>
              {insight.title || "Untitled insight"}
            </h1>
            {insight.description && (
              <p className={styles.insightDescription}>{insight.description}</p>
            )}
            <div className={styles.insightMeta}>
              <span>{`${citationCount} citation${citationCount === 1 ? "" : "s"}`}</span>
              <span>·</span>
              <span>{`${parentCount} parent${parentCount === 1 ? "" : "s"}`}</span>
              <span>·</span>
              <span>{`${childCount} child${childCount === 1 ? "" : "ren"}`}</span>
            </div>
          </header>

          {/* Focused Node Mind Map */}
          <section
            className={styles.networkSection}
            aria-label="Insight Mind Map"
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Relational Topology</h2>
              <p className={styles.sectionSubtitle}>
                Direct parent and child mind-map connections for this insight
              </p>
            </div>
            <div className={styles.canvasWrapper}>
              <RadialNetwork data={localGraphData} crossLinks={[]} />
            </div>
          </section>

          {/* Relational Lists & Evidence */}
          <div className={styles.detailsGrid}>
            <section className={styles.detailSection}>
              <h3 className={styles.subSectionTitle}>
                Parents ({parentCount})
              </h3>
              {!insight.parents || insight.parents.length === 0 ? (
                <p className={styles.emptyText}>
                  No parent insights connected.
                </p>
              ) : (
                <ul className={styles.linkList}>
                  {insight.parents.map((link) => {
                    const parent = link.parentInsight;
                    if (!parent) return null;
                    return (
                      <li
                        key={link.id || parent.uid}
                        className={styles.linkItem}
                      >
                        <Link
                          href={`/insights/${parent.uid}`}
                          className={styles.nodeLink}
                        >
                          {parent.title || "Untitled Parent"}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className={styles.detailSection}>
              <h3 className={styles.subSectionTitle}>
                Children ({childCount})
              </h3>
              {!insight.children || insight.children.length === 0 ? (
                <p className={styles.emptyText}>No child insights connected.</p>
              ) : (
                <ul className={styles.linkList}>
                  {insight.children.map((link) => {
                    const child = link.childInsight;
                    if (!child) return null;
                    return (
                      <li
                        key={link.id || child.uid}
                        className={styles.linkItem}
                      >
                        <Link
                          href={`/insights/${child.uid}`}
                          className={styles.nodeLink}
                        >
                          {child.title || "Untitled Child"}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className={styles.detailSection}>
              <h3 className={styles.subSectionTitle}>
                Citations ({citationCount})
              </h3>
              {!insight.evidence || insight.evidence.length === 0 ? (
                <p className={styles.emptyText}>No citations added yet.</p>
              ) : (
                <ul className={styles.evidenceList}>
                  {insight.evidence.map((item, idx) => (
                    <li key={item.id || idx} className={styles.evidenceItem}>
                      {item.summary?.url ? (
                        <a
                          href={item.summary.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.externalLink}
                        >
                          {item.summary.title || item.summary.url}
                        </a>
                      ) : (
                        <span>Citation #{item.id || idx + 1}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </CurrentUserContext.Provider>
  );
};

export default ClientSidePage;
