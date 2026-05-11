const BASE_URL = "/randomuser/api/";
export async function fetchAllUsers(totalUsers = 500) {
  const pageSize = 100;
  const pages = Math.ceil(totalUsers / pageSize);
  const seed = "59902bdd2bae280e";

  const requests = Array.from({ length: pages }, (_, i) =>
    fetch(`${BASE_URL}?results=${pageSize}&page=${i + 1}&seed=${seed}`)
      .then(r => r.json())
      .then(d => d.results)
  );

  const results = await Promise.all(requests);
  return results.flat();
}

export function groupByYearMonth(users) {
  const map = {};
  users.forEach(user => {
    const date = new Date(user.registered.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (!map[year]) map[year] = Array(12).fill(0);
    map[year][month]++;
  });
  return map;
}

export function getCumulativeByYearMonth(users) {
  const raw = {};
  users.forEach(user => {
    const date = new Date(user.registered.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;
    raw[key] = (raw[key] || 0) + 1;
  });
  return raw;
}

export function getAvailableYears(users) {
  const years = new Set(users.map(u => new Date(u.registered.date).getFullYear()));
  return [...years].sort((a, b) => b - a);
}

export function getGenderStats(users) {
  const counts = { male: 0, female: 0 };
  users.forEach(u => {
    if (u.gender === 'male') counts.male++;
    else if (u.gender === 'female') counts.female++;
  });
  return counts;
}

export function getTopCountries(users, n = 5) {
  const counts = {};
  users.forEach(u => {
    counts[u.location.country] = (counts[u.location.country] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export function getAgeDistribution(users) {
  const brackets = { '18-25': 0, '26-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
  users.forEach(u => {
    const age = u.dob.age;
    if (age <= 25) brackets['18-25']++;
    else if (age <= 35) brackets['26-35']++;
    else if (age <= 50) brackets['36-50']++;
    else if (age <= 65) brackets['51-65']++;
    else brackets['65+']++;
  });
  return brackets;
}
