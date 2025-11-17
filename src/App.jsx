import { useState, useEffect } from "react";
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from "axios";

function App() {
  const [code, setCode] = useState(`function sum() {
  return 1 + 1
}`);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // initial highlight for editor content
    prism.highlightAll();
  }, []);

  useEffect(() => {
    // highlight markdown/code that appears in the review area
    // run after review is set
    prism.highlightAll();
  }, [review]);

  async function reviewCode() {
    try {
      setError(null);
      setReview("");        // keep as a string so UI doesn't flicker
      setLoading(true);

      // Add a small artificial delay for demo/testing if you want:
      // await new Promise(r => setTimeout(r, 300));

      const response = await axios.post(
        "http://localhost:3000/ai/get-review",
        { code },
        { timeout: 20000 } // give it a reasonable timeout
      );

      // support response shapes like { review: "..."} or direct string
      const data = response?.data;
      const text = (data && (data.review || data.text || data)) || "";
      setReview(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    } catch (err) {
      console.error(err);
      // setError(
      //   err?.response?.data?.message ||
      //     "Failed to fetch review. Check console/network and CORS."
      // );
      setReview("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        /* layout & basic styles */
        body { margin:0; font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto; }
        main{display:flex;min-height:80vh;padding:20px;gap:18px;align-items:stretch}
        .left{flex:1;display:flex;flex-direction:column;gap:12px;min-width:360px}
        .code{flex:1;min-height:240px;display:flex;flex-direction:column}
        .reviewBtnWrap{display:flex;gap:8px;align-items:center}
        .btn {
          display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;border:none;cursor:pointer;font-weight:600;background:#6366f1;color:#fff;
          box-shadow: 0 4px 14px rgba(99,102,241,.15);
        }
        .btn:disabled{opacity:0.6;cursor:not-allowed}
        .spinner{
          width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);border-top-color:rgba(255,255,255,0.95);animation:spin 0.8s linear infinite
        }
        @keyframes spin{to{transform:rotate(360deg)}}

        /* right panel */
        .right{flex:1;border:1px solid #ddd;border-radius:12px;padding:12px;min-height:200px;background:#0b0f14;color:#e5e7eb;overflow:hidden;display:flex;flex-direction:column}
        .status{margin-bottom:10px;font-size:14px;display:flex;align-items:center;gap:8px}
        .error{color:#ff6b6b}
        .reviewContent{flex:1;overflow:auto;padding-right:8px; scrollbar-gutter: stable;}
        .skeleton{background:linear-gradient(90deg,#1f2937 25%, #111827 37%, #1f2937 63%);background-size:400% 100%;animation:shimmer 1.2s linear infinite;border-radius:6px}
        @keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
        .skeleton-line{height:14px;margin-bottom:12px}
        .skeleton-block{height:160px;margin-bottom:12px;border-radius:8px}

        /* loading overlay (centered) */
        .overlay {
          position: absolute;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:center;
          pointer-events:none;
        }
        .rightWrapper{position:relative; height:100%; width:100%;}
        .overlayInner {
          pointer-events:auto;
          background: rgba(4,6,9,0.6);
          padding:16px 20px;
          border-radius:10px;
          display:flex;
          gap:12px;
          align-items:center;
          color:white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        /* small responsive tweak */
        @media (max-width:900px){ main{flex-direction:column} .left,.right{min-width:unset} }
      `}</style>

      <main>
        <div className="left">
          <div className="code">
            <Editor
              value={code}
              onValueChange={(c) => setCode(c)}
              highlight={(c) => prism.highlight(c, prism.languages.javascript, "javascript")}
              padding={12}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 15,
                borderRadius: 10,
                height: "100%",
                width: "100%",
                minHeight: 240,
                background: "#0b0f14",
                color: "#e5e7eb",
                boxSizing: "border-box",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            />
          </div>

         
        </div>

        <div className="right">
          <div className="status" role="status" aria-live="polite">
            {loading && (
              <>
                <div className="spinner" style={{ borderTopColor: "#0ea5a4" }} />
                <div>Review in progress — this can take a few seconds…</div>
              </>
            )}
            {error && <div className="error">{error}</div>}
          </div>

          <div className="rightWrapper">
            {/* overlay centered message while loading */}
            {loading && (
              <div className="overlay" aria-hidden="true">
                <div className="overlayInner">
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 3 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Reviewing code…</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Rendering suggestions shortly</div>
                  </div>
                </div>
              </div>
            )}

            <div className="reviewContent">
              {loading ? (
                <div>
                  <div className="skeleton skeleton-block" style={{ width: "100%" }} />
                  <div className="skeleton skeleton-line" style={{ width: "86%" }} />
                  <div className="skeleton skeleton-line" style={{ width: "72%" }} />
                  <div className="skeleton skeleton-line" style={{ width: "94%" }} />
                  <div className="skeleton skeleton-line" style={{ width: "60%" }} />
                </div>
              ) : (
                <>
                  {review ? (
                    <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
                  ) : (
                    <div style={{ color: "#9ca3af" }}>
                      No review yet. Click <strong>Review</strong> to get feedback.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
       <div className="reviewBtnWrap " style={{ padding: "0 20px 40px", minHeight: 40 , justifyContent: "center",flexDirection : "column"}}>
            <button
              className="btn"
              onClick={reviewCode}
              disabled={loading}
              aria-busy={loading}
              aria-live="polite"
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>Reviewing...</span>
                </>
              ) : (
                <span>Review</span>
              )}
            </button>

            <div style={{ fontSize: 13, color: "#9ca3af" }}>
              {loading ? "Please wait — AI is reviewing your code." : "Click to send code for review."}
            </div>
          </div>
    </>
  );
}

export default App;
