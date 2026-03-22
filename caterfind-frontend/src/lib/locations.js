// Simple state -> cities mapping for the registration UI.
// Expand this list as needed or replace with an API call.

export const states = [
  'Delhi',
  'Gujarat',
  'Maharashtra',
  'Tamil Nadu',
  'West Bengal',
  'Karnataka'
];

export const citiesByState = {
  'Delhi': ['New Delhi', 'South Delhi', 'Janakpuri', 'Dwarka', 'Rohini'],
  'Gujarat': ['Surat', 'Ahmedabad', 'Vadodara', 'Rajkot'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  'West Bengal': ['Kolkata', 'Siliguri'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangalore']
};

export const getCities = (state) => {
  if (!state) return [];
  return citiesByState[state] || [];
};

export default { states, citiesByState, getCities };
