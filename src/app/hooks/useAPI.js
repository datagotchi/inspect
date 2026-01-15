import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";

const useAPI = (cookieUser) => {
  const [email, setEmail] = useState();
  const [fnToken, setFnToken] = useState();

  useEffect(() => {
    if (cookieUser) {
      setEmail(cookieUser.email);
      setFnToken(cookieUser.token);
    } else {
      setEmail(undefined);
      setFnToken(undefined);
    }
  }, [cookieUser]);

  const _setCookieAndReturnUser = (user) => {
    // TODO: enable secure cookie when we switch to HTTPS
    // js-cookie handles JSON objects automatically.
    // It also correctly sets path, expiration, and SameSite attributes.
    Cookies.set("token", user, { expires: 7, sameSite: "Lax" }); // `expires: 7` means 7 days
    return user;
  };

  const register = (email, password) =>
    fetch("/api/users/register", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        return data;
      })
      .then(_setCookieAndReturnUser)
      .catch((err) => alert(err));

  const login = (email, password) =>
    fetch("/api/users/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          return alert(data.error);
        }
        return data;
      })
      .then(_setCookieAndReturnUser);

  const logout = (email) =>
    fetch(`/api/users/logout/${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${fnToken}`, "x-email": email },
    });

  const getNotes = useCallback(
    () =>
      fetch("/api/notes", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${fnToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": email,
        },
      }).then((response) => response.json()),
    [fnToken, email]
  );

  const addNote = useCallback(
    (note) =>
      fetch("/api/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fnToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": email,
        },
        body: JSON.stringify(note),
      }).then((response) => response.json()),
    [fnToken, email]
  );

  const deleteNote = useCallback(
    (note) =>
      fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${fnToken}`, "x-email": email },
      }),
    [fnToken, email]
  );

  const updateNote = useCallback(
    (notePartial) =>
      fetch(`/api/notes/${notePartial.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${fnToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": email,
        },
        body: JSON.stringify(notePartial),
      }).then((response) => response.json()),
    [fnToken, email]
  );

  const getFields = useCallback(
    () =>
      fetch("/api/fields", {
        method: "GET",
        headers: { Authorization: `Bearer ${fnToken}`, "x-email": email },
      }).then((response) => response.json()),
    [fnToken, email]
  );

  const addField = useCallback(
    (fieldName) =>
      fetch("/api/fields", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fnToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": email,
        },
        body: JSON.stringify({ name: fieldName }),
      }).then((response) => response.json()),
    [fnToken, email]
  );

  const useField = useCallback(
    async (noteId, fieldId, value, newTextValue) => {
      const newField = {
        field_id: fieldId,
        note_id: noteId,
        value,
      };
      const results = [];
      results.push(
        await fetch(`/api/field_values`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${fnToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-email": email,
          },
          body: JSON.stringify(newField),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json();
              throw {
                ...errorData,
                status: response.status,
              };
            }
            return response.json();
          })
          .catch((err) => {
            throw err;
          })
      );

      if (newTextValue !== undefined) {
        results.push(await updateNote({ id: noteId, text: newTextValue }));
      }
      return {
        id: noteId,
        field_values: [results[0]],
        text: results[1]?.text,
      };
    },
    [email, fnToken]
  );

  const updateFieldValue = useCallback(
    (noteId, fieldId, value) =>
      fetch(`/api/field_values/${noteId}/${fieldId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${fnToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": email,
        },
        body: JSON.stringify({ value }),
      }).then((response) => response.json()),
    [email, fnToken]
  );

  const deleteField = useCallback(
    (noteId, fieldId) =>
      fetch(`/api/field_values/${noteId}/${fieldId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${fnToken}`, "x-email": email },
      }),
    [email, fnToken]
  );

  return {
    email,
    fnToken,
    register,
    login,
    logout,
    getNotes,
    addNote,
    deleteNote,
    updateNote,
    getFields,
    addField,
    useField,
    updateFieldValue,
    deleteField,
  };
};

export default useAPI;
