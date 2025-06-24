export const zeroizeArray = (array) => {
  if (array && array.fill) {
    array.fill(0);
    array.fill(0xFF);
    array.fill(0);
  }
};

export const zeroizeObject = (obj) => {
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (typeof val === 'object' && val !== null) {
      zeroizeObject(val);
    } else if (Array.isArray(val)) {
      zeroizeArray(val);
    } else if (typeof val === 'string' || val instanceof String) {
      obj[key] = '\x00'.repeat(val.length);
    } else if (typeof val === 'number') {
      obj[key] = 0;
    }
    delete obj[key];
  });
};

export const zeroizeLocalStorage = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    localStorage.setItem(key, '\x00'.repeat(value.length));
    localStorage.removeItem(key);
  });
};

export const purgeSession = () => {
  sessionStorage.clear();
  zeroizeLocalStorage();
  indexedDB.databases().then(dbs => {
    dbs.forEach(db => indexedDB.deleteDatabase(db.name));
  });
};