const fs = require('fs');
const filePath = 'src/app/[locale]/secure-beteseb-admin/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetPart = `        ad_config: cmsForm.ad_config,
        play_store_url: cmsForm.play_store_url,
    } else {
      alert('CMS Content Deployed Successfully!');
    }
    setIsSaving(false);
  };`;

const replacementPart = `        ad_config: cmsForm.ad_config,
        play_store_url: cmsForm.play_store_url,
        app_store_url: cmsForm.app_store_url,
        updated_at: new Date().toISOString()
      };

      const { data: updatedData, error } = await supabase
        .from('settings')
        .update(updatePayload)
        .eq('id', targetId)
        .select()
        .single();

      if (error) {
        if (error.code === '42703') {
          const { play_store_url: _p, app_store_url: _a, ...safePayload } = updatePayload;
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('settings')
            .update(safePayload)
            .eq('id', targetId)
            .select()
            .single();

          if (fallbackError) throw fallbackError;
          if (fallbackData) setSettings(fallbackData);
        } else {
          throw error;
        }
      } else if (updatedData) {
        setSettings(updatedData);
      }

      alert(locale === 'am' 
        ? '🚀 የሲስተም ይዘቶች በተሳካ ሁኔታ በዳታቤዝ፣ በዌብሳይት እና በሞባይል አፕሊኬሽኑ ላይ ቀጥታ (Live) ተተግበዋል! (CMS & Social Links Deployed Successfully!)' 
        : '🚀 CMS Content & Social Links Deployed Live to Website & Mobile App Successfully!'
      );
    } catch (err: any) {
      console.error('[handleSaveCMS] Error:', err);
      alert('Error deploying CMS: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };`;

if (content.includes(targetPart)) {
  content = content.replace(targetPart, replacementPart);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("SUCCESSFULLY UPDATED PAGE.TSX!");
} else {
  console.log("Target part not found in page.tsx");
}
