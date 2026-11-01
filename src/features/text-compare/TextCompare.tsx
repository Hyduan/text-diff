import { useRef, useState } from "react";
import { ComparisonStatus } from "./ComparisonStatus";
import { ComparisonToolbar } from "./ComparisonToolbar";
import { Icon } from "./Icon";
import { emptySnapshot, MergeEditor } from "./MergeEditor";
import type { MergeEditorHandle } from "./MergeEditor";
import { sampleTexts } from "./sample";
import styles from "./TextCompare.module.css";

export function TextCompare() {
  const editorRef = useRef<MergeEditorHandle>(null);
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const hasText = snapshot.left.characters > 0 || snapshot.right.characters > 0;

  return (
    <main className={styles.page} aria-labelledby="comparison-title">
      <div className={styles.intro}>
        <div>
          <h1 id="comparison-title" className={styles.title}>
            文本对比
          </h1>
          <p className={styles.subtitle}>
            粘贴两段文本，每一处不同都清晰可见。
          </p>
        </div>
        <button
          className={styles.sampleButton}
          type="button"
          onClick={() =>
            editorRef.current?.replaceTexts(sampleTexts.left, sampleTexts.right)
          }
          disabled={hasText}
          title={hasText ? "清空当前文本后可载入示例" : "载入一组中文示例文本"}
        >
          <Icon name="sample" />
          试试示例
        </button>
      </div>

      <section className={styles.workspace} aria-label="文本对比编辑区">
        <ComparisonToolbar
          total={snapshot.groups.length}
          activeIndex={snapshot.activeIndex}
          hasText={hasText}
          onSwap={() => editorRef.current?.swap()}
          onClear={() => editorRef.current?.replaceTexts("", "")}
          onNavigate={(direction) => editorRef.current?.navigate(direction)}
        />
        <div className={styles.editorPanel}>
          <div className={styles.paneHeaders}>
            <div>
              <span className={styles.paneName}>
                <span className={styles.beforeDot} />
                原始文本
              </span>
              <span>
                {snapshot.left.lines} 行 · {snapshot.left.characters} 字符
              </span>
            </div>
            <div>
              <span className={styles.paneName}>
                <span className={styles.afterDot} />
                修改后文本
              </span>
              <span>
                {snapshot.right.lines} 行 · {snapshot.right.characters} 字符
              </span>
            </div>
          </div>
          <MergeEditor ref={editorRef} onStateChange={setSnapshot} />
        </div>
        <ComparisonStatus snapshot={snapshot} />
      </section>
    </main>
  );
}
