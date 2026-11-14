// PART 3 - the hook of the exams screen: the list with its three states, delete and create.
// Run it with:  npm test -- useExams
//
// It must return { status, exams, error, actionError, saving, reload, remove, create }:
//   status       "loading" | "ready" | "error"   (the three states of the request that lists)
//   exams        the array of exams ([] while loading and on error)
//   error        the sentence for the person when the LIST failed (null otherwise); use describeError
//   actionError  the sentence when a delete or a create failed (null otherwise); the list stays as it was
//   saving       true while a create is in flight
//   reload()     asks for the list again (status goes back to "loading")
//   remove(id)   DELETE; when the server confirms, the exam disappears from `exams`; resolves true or false
//   create(title) POST; when the server confirms, the new exam is added; resolves true or false
//
// TODO 1: the state and a useEffect that lists, with the three states.
// TODO 2: `reload` (a counter that is a dependency of the effect is enough).
// TODO 3: `remove` and `create`. NEVER swallow an error: set `actionError` with describeError. `create` must
//         ignore a second call while the first one is still in flight (use a ref: a state is too late).
// Rule of the course: no hook inside an if, a loop or after a return.
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { createExam, deleteExam, listExams, describeError } from "./api";

export default function useExams() {
  const [status, setStatus] = useState("loading");
  
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const creating = useRef(false);
  
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    listExams({ signal: controller.signal })
      .then((data) => {
        if (!cancelled) {
          setExams(data);
          setStatus("ready");
          setError(null);
        }
      })
      .catch((err) => {
        if (axios.isCancel(err)) {
          // petición cancelada, no actualizar estado
        } else if (!cancelled) {
          setError(describeError(err));
          setStatus("error");
          setExams([]);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadCount]);

  const reload = useCallback(() => {
    setReloadCount((n) => n + 1);
    setStatus("loading");
    setExams([]);
    setError(null);
    setActionError(null);
  }, [reloadCount]);

  return {
    status,
    exams,
    error,
    actionError,
    saving,
    reload,
    remove: async (id) => {
      setActionError(null);
      try {
        await deleteExam(id);
        setExams((exams) => exams.filter((exam) => exam.id !== id));
        return true;
      } catch (err) {
        setActionError(describeError(err));
        return false;
      }
    },
    create: async (title) => {
      if (creating.current) {
        return false;
      }
      creating.current = true;
      setActionError(null);
      setSaving(true);
      try {
        const exam = await createExam(title);
        setExams((exams) => [...exams, exam]);
        setSaving(false);
        creating.current = false;
        return true;
      } catch (err) {
        setActionError(describeError(err));
        setSaving(false);
        creating.current = false;
        return false;
      }
    },
  };
}
