const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/[locale]/secure-beteseb-admin/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the index of the Chapa reference lookup block
const anchor = 'chapaLookupResult.chapaData.reference';
const idx = content.indexOf(anchor);

if (idx === -1) {
  console.error('Anchor not found!');
  process.exit(1);
}

// Find the closing of the lookup result card div:
// We look for the closing tags that come right after the anchor
const searchStartIdx = idx + anchor.length;
const closingDivIdx = content.indexOf('</div>', searchStartIdx);
const closingParenIdx = content.indexOf(')}', closingDivIdx);

if (closingDivIdx === -1 || closingParenIdx === -1) {
  console.error('Closing tags not found!');
  process.exit(1);
}

// The closing block ends at closingParenIdx + 2
const endOfBlockIdx = closingParenIdx + 2;

// Let's insert the new JSX right after endOfBlockIdx
const before = content.substring(0, endOfBlockIdx);
const after = content.substring(endOfBlockIdx);

const newUI = `
                        <hr className="border-gray-100 my-2" />
                        <div>
                           <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Bulk Transactions Sync</label>
                           <button
                              onClick={handleChapaSync}
                              disabled={chapaSyncing}
                              className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
                           >
                              {chapaSyncing ? 'Syncing with Chapa...' : '🔄 Sync All Chapa Dashboard Payments'}
                           </button>
                        </div>
                        {chapaSyncResult && (
                           <div className="p-4 bg-primary/5 rounded-xl text-xs space-y-1.5 border border-primary/10 max-h-48 overflow-y-auto">
                              <div className="font-bold text-primary">{chapaSyncResult.message}</div>
                              {chapaSyncResult.synced && chapaSyncResult.synced.length > 0 && (
                                 <div className="space-y-1 mt-1 font-sans">
                                    <div className="font-semibold text-green-600 uppercase text-[10px]">Synced/Credited:</div>
                                    {chapaSyncResult.synced.map((tx, idx) => (
                                       <div key={idx} className="pl-2 border-l border-green-300">
                                          User: <b>{tx.user}</b> ({tx.email})<br />
                                          Details: <b>{tx.details}</b> | Ref: <code>{tx.ref_id}</code>
                                       </div>
                                    ))}
                                 </div>
                              )}
                              {chapaSyncResult.failed && chapaSyncResult.failed.length > 0 && (
                                 <div className="space-y-1 mt-1 font-sans">
                                    <div className="font-semibold text-red-600 uppercase text-[10px]">Failed/Unmatched:</div>
                                    {chapaSyncResult.failed.map((tx, idx) => (
                                       <div key={idx} className="pl-2 border-l border-red-300 text-gray-500">
                                          Ref: <code>{tx.ref_id}</code> - <span className="text-red-500">{tx.reason}</span>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        )}`;

fs.writeFileSync(filePath, before + newUI + after, 'utf8');
console.log('Successfully inserted Chapa Sync UI using absolute index finding!');
