// Simple state -> cities mapping for the registration UI.
// Expand this list as needed or replace with an API call.

export const states = [
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Karnataka', label: 'Karnataka' }
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
