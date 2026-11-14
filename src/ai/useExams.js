import axios from "axios";
import { useCallback, useEffect, useState, useRef } from "react";
import { createExam, deleteExam, describeError, listExams } from "./api";

export default function useExams() {
  const [status, setStatus] = useState("loading");
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const creating = useRef(false);

  useEffect(() => {
    setStatus("loading");
    setError(null);
    const controller = new AbortController();
    let cancelled = false;
    listExams({ signal: controller.signal })
      .then((data) => {
        if (!cancelled) {
          setExams(data);
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (cancelled || axios.isCancel(err)) {
          // petición cancelada, no actualizar estado
        } else {
          setError(describeError(err));
          setExams([]);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const remove = useCallback(async (id) => {
    try {
      setActionError(null);
      await deleteExam(id);
      setExams((current) => current.filter((exam) => exam.id !== id));
      return true;
    } catch (err) {
      setActionError(describeError(err));
      return false;
    }
  }, []);

    const create = useCallback(async (title) => {
    if (creating.current) {
      return false;
    }
    creating.current = true;
    setActionError(null);
    setSaving(true);
    try {
      const exam = await createExam(title);
      setExams((current) => [...current, exam]);
      return true;
    } catch (err) {
      setActionError(describeError(err));
      return false;
    } finally {
      creating.current = false;
      setSaving(false);
    }
  }, []);

  return { status, exams, error, actionError, saving, reload, remove, create };
}
