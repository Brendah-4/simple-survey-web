const BASE = 'https://simple-survey-api-c3kj.onrender.com/api';

async function request(method, path, body = null, isFormData = false) {
  const options = { method, headers: {} };

  if (body) {
    if (isFormData) {
      options.body = body;
    } else {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      options.body = new URLSearchParams(body).toString();
    }
  }

  const res = await fetch(BASE + path, options);
  const text = await res.text();
  const parsed = parseXml(text);
  if (parsed?.status === 'error') throw new Error(parsed?.message || 'API error');
  return parsed;
}

function parseXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  return xmlNodeToJs(doc.documentElement);
}

function xmlNodeToJs(node) {
  if (node.children.length === 0) return node.textContent;

  const result = {};
  for (const child of node.children) {
    const key = child.tagName;
    const val = xmlNodeToJs(child);
    if (result[key] !== undefined) {
      if (!Array.isArray(result[key])) result[key] = [result[key]];
      result[key].push(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

function getList(parsed, listKey) {
  const data = parsed?.data;
  if (!data) return [];
  const container = data[listKey];
  if (!container) return [];
  if (!container.item) return [];
  return Array.isArray(container.item) ? container.item : [container.item];
}

function getOne(parsed, key) {
  return parsed?.data?.[key] ?? null;
}

export const api = {
  surveys: {
    list: () => request('GET', '/surveys').then(r => getList(r, 'surveys')),
    get: (id) => request('GET', '/surveys/' + id).then(r => getOne(r, 'survey')),
    create: (data) => request('POST', '/surveys', data).then(r => getOne(r, 'survey')),
    update: (id, data) => request('PUT', '/surveys/' + id, data).then(r => getOne(r, 'survey')),
    delete: (id) => request('DELETE', '/surveys/' + id),
  },
  questions: {
    list: (surveyId) => request('GET', '/surveys/' + surveyId + '/questions').then(r => getList(r, 'questions')),
    get: (id) => request('GET', '/questions/' + id).then(r => getOne(r, 'question')),
    create: (surveyId, data) => request('POST', '/surveys/' + surveyId + '/questions', data).then(r => getOne(r, 'question')),
    update: (id, data) => request('PUT', '/questions/' + id, data).then(r => getOne(r, 'question')),
    delete: (id) => request('DELETE', '/questions/' + id),
  },
  responses: {
    list: (surveyId, params) => {
      const p = params || {};
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null))).toString();
      return request('GET', '/surveys/' + surveyId + '/responses' + (qs ? '?' + qs : '')).then(r => r?.data ?? {});
    },
    submit: (surveyId, formData) => request('POST', '/surveys/' + surveyId + '/responses', formData, true).then(r => r?.data),
  },
};