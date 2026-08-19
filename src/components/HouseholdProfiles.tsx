import React, { useState } from 'react';
import { Users, ShieldAlert, Plus, Trash2, Heart, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { HouseholdMember } from '../types';

interface HouseholdProfilesProps {
  profiles: HouseholdMember[];
  setProfiles: React.Dispatch<React.SetStateAction<HouseholdMember[]>>;
}

export const HouseholdProfiles: React.FC<HouseholdProfilesProps> = ({
  profiles,
  setProfiles,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState<HouseholdMember['ageRange']>('30s');
  const [activityBand, setActivityBand] = useState<HouseholdMember['activityBand']>('moderate');
  const [dietaryInput, setDietaryInput] = useState('Vegetarian');
  const [tastePreferences, setTastePreferences] = useState('');
  const [favoriteDishesInput, setFavoriteDishesInput] = useState('');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMember: HouseholdMember = {
      id: `mem-${Date.now()}`,
      name: name.trim(),
      ageRange,
      activityBand,
      dietaryRestrictions: dietaryInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tastePreferences: tastePreferences.trim() || 'Enjoys balanced home-cooked meals.',
      favoriteDishes: favoriteDishesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setProfiles((prev) => [...prev, newMember]);
    setIsAddModalOpen(false);
    setName('');
    setTastePreferences('');
    setFavoriteDishesInput('');
  };

  const handleDeleteMember = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header & Butler Policy */}
      <div className="bg-[#faf8f5] border border-amber-950/10 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-700" />
              <h2 className="text-xl font-serif font-semibold text-stone-900">
                Household Dietary Profiles & Preferences
              </h2>
            </div>
            <p className="text-sm text-stone-600">
              Alfred customizes meal recommendations and spice balances to satisfy every member of your home.
            </p>
          </div>

          <button
            id="add-member-btn"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Household Member</span>
          </button>
        </div>

        {/* Strict Privacy & Medical Boundary Notice */}
        <div className="mt-5 pt-4 border-t border-amber-950/10 bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-stone-800">
          <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-950">Alfred's Privacy & Health Boundary:</span>
            <p className="text-stone-700 font-sans">
              "We record solely culinary tastes, general age bands, and dietary boundaries (such as Jain, Vegetarian, or allergies). Exact age, weight, and biometric data are strictly never collected. Furthermore, as a butler, I am not qualified to provide medical or nutritional advice."
            </p>
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-100 flex items-center justify-center font-serif font-bold text-base shadow-xs">
                    {member.name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-stone-900">{member.name}</h3>
                    <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <span>{member.ageRange}</span>
                      <span>•</span>
                      <span className="capitalize">{member.activityBand} Lifestyle</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-stone-300 hover:text-rose-600 transition-colors p-1"
                  title="Remove profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Dietary Tags */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  Dietary Restrictions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {member.dietaryRestrictions.map((d, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200/80 font-medium"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Taste Preferences */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  Taste Notes
                </span>
                <p className="text-xs text-stone-600 font-sans leading-relaxed bg-stone-50/70 p-2.5 rounded-lg border border-stone-100">
                  "{member.tastePreferences}"
                </p>
              </div>

              {/* Favorite Dishes */}
              {member.favoriteDishes && member.favoriteDishes.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Favorite Dishes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {member.favoriteDishes.map((dish, dIdx) => (
                      <span
                        key={dIdx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60"
                      >
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Strictly Private</span>
              </span>
              <span>Respected in daily meal curation</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-serif font-semibold text-stone-900">Add Household Member</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Name / Alias *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan, Priya, Dadi, Aarav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Age Range</label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value as HouseholdMember['ageRange'])}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="Toddler">Toddler</option>
                    <option value="Child">Child</option>
                    <option value="Teen">Teen</option>
                    <option value="20s">20s</option>
                    <option value="30s">30s</option>
                    <option value="40s">40s</option>
                    <option value="50s">50s</option>
                    <option value="60s+">60s+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Activity Band</label>
                  <select
                    value={activityBand}
                    onChange={(e) => setActivityBand(e.target.value as HouseholdMember['activityBand'])}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="sedentary">Sedentary</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Dietary Restrictions (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vegetarian, Jain, No Onion-Garlic, Nut Allergy"
                  value={dietaryInput}
                  onChange={(e) => setDietaryInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Taste Preferences</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Loves spicy Chettinad rasam, prefers light dinners, likes crunchy salads"
                  value={tastePreferences}
                  onChange={(e) => setTastePreferences(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Favorite Dishes (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Palak Paneer, Moong Dal Khichdi, Poha"
                  value={favoriteDishesInput}
                  onChange={(e) => setFavoriteDishesInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
