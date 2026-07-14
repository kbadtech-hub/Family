const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'app', '[locale]', 'onboarding', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// We want to replace from case 1: inside renderStep
// Let's find "case 1:" inside renderStep
const renderStepMarker = 'const renderStep = () => {';
const renderStepIdx = content.indexOf(renderStepMarker);
if (renderStepIdx === -1) {
  console.error("Could not find renderStep declaration");
  process.exit(1);
}

// Find case 1 and case 2 start indices after renderStepMarker
const case1Idx = content.indexOf('case 1:', renderStepIdx);
const case2Idx = content.indexOf('case 2:', case1Idx);

if (case1Idx === -1 || case2Idx === -1) {
  console.error("Could not find case 1 or case 2 indices");
  process.exit(1);
}

// Replacement string for case 1
const quickSetupContent = `case 1:
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-accent italic uppercase tracking-tighter leading-none">
                {locale === 'am' ? 'የመገለጫ ፈጣን ማዋቀር' : 'Quick Profile Setup'}
              </h2>
              <p className="text-gray-500 font-medium italic text-xs max-w-sm mx-auto">
                {locale === 'am' 
                  ? 'እባክዎ መለያዎን ለመፍጠር የሚከተሉትን መሰረታዊ መረጃዎች ያሟሉ' 
                  : 'Please complete the details below to initialize your account.'}
              </p>
            </div>
            
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-primary/10 shadow-2xl space-y-6">
              
              {/* Profile Picture Uploader */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {locale === 'am' ? 'የመገለጫ ፎቶ' : 'Profile Picture'}
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-muted border-2 border-primary/20 rounded-[2rem] overflow-hidden relative flex items-center justify-center shadow-inner">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={32} className="text-gray-300" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all">
                    {locale === 'am' ? 'ፎቶ ይጫኑ' : 'Upload Photo'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !userId) return;
                        setIsSubmitting(true);
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = \`avatar-\${userId}-\${Date.now()}.\${fileExt}\`;
                          const { error } = await supabase.storage.from('user_photos').upload(fileName, file);
                          if (error) throw error;
                          const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                          updateField('avatar_url', publicUrl);
                        } catch (err) {
                          alert("Upload failed: " + err.message);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Legal Name Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {locale === 'am' ? 'ሙሉ ስም (Display Name)' : 'Legal Name / Display Name'}
                </label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary p-4 bg-muted/30 text-sm font-semibold" 
                  placeholder={locale === 'am' ? 'ለምሳሌ፡ ዮናስ አበበ' : 'e.g. Dawit Kebede'}
                />
              </div>

              {/* Gender Input */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {t('fields.gender')}
                </label>
                <select 
                  value={formData.gender} 
                  onChange={(e) => updateField('gender', e.target.value)} 
                  className="w-full p-4 bg-muted/30 border border-gray-200 rounded-2xl font-bold text-xs"
                >
                  <option value="">{t('fields.gender')}</option>
                  {GENDERS.map(g => <option key={g} value={g}>{t_const(\`Genders.\${g}\`)}</option>)}
                </select>
              </div>

              {/* Date of Birth Input with Calendar Toggle */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  {locale === 'am' ? 'የልደት ቀን' : 'Birth Date'}
                </label>
                <div className="flex gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl w-fit border border-gray-150 shadow-sm">
                  <button type="button" onClick={() => updateField('calendar_type', 'gregorian')} className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${formData.calendar_type === 'gregorian' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}\`}>{t('calendar.gregorian')}</button>
                  <button type="button" onClick={() => updateField('calendar_type', 'ethiopian')} className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${formData.calendar_type === 'ethiopian' ? 'bg-white text-primary shadow-md' : 'text-gray-400'}\`}>{t('calendar.ethiopian')}</button>
                </div>
                
                {formData.calendar_type === 'ethiopian' ? (
                  <div className="grid grid-cols-3 gap-3">
                     <select value={formData.eth_birth_day} aria-label={t('calendar.day')} onChange={(e) => updateField('eth_birth_day', e.target.value)} className="p-4 bg-muted/30 border border-gray-150 rounded-2xl font-bold text-xs">
                       <option value="">{t('calendar.day') || 'Day'}</option>
                       {Array.from({ length: formData.eth_birth_month === '13' ? 6 : 30 }, (_, i) => i + 1).map(day => (
                         <option key={day} value={day}>{day}</option>
                       ))}
                     </select>
                     <select value={formData.eth_birth_month} aria-label={t('calendar.month')} onChange={(e) => updateField('eth_birth_month', e.target.value)} className="p-4 bg-muted/30 border border-gray-150 rounded-2xl font-bold text-xs">
                       <option value="">{t('calendar.month') || 'Month'}</option>
                       {['Meskerem', 'Tikemt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'].map((m, i) => <option key={m} value={i + 1}>{t_const(\`Months.\${m}\`)}</option>)}
                     </select>
                     <select value={formData.eth_birth_year} aria-label={t('calendar.year')} onChange={(e) => updateField('eth_birth_year', e.target.value)} className="p-4 bg-muted/30 border border-gray-150 rounded-2xl font-bold text-xs">
                       <option value="">{t('calendar.year') || 'Year'}</option>
                       {Array.from({ length: 70 }, (_, i) => 2018 - 18 - i).map(year => (
                         <option key={year} value={year}>{year}</option>
                       ))}
                     </select>
                  </div>
                ) : (
                  <input 
                    type="date" 
                    value={formData.birth_date} 
                    onChange={(e) => updateField('birth_date', e.target.value)} 
                    className="w-full rounded-2xl border-gray-200 p-4 bg-muted/30 text-sm font-semibold" 
                  />
                )}
              </div>

            </div>
          </div>
        );
      `;

// We replace the substring from case1Idx to case2Idx
const updatedContent = content.substring(0, case1Idx) + quickSetupContent + content.substring(case2Idx);
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log("Successfully replaced Case 1 inside renderStep with Quick Profile Setup!");
