#!/usr/bin/env python3
"""branding_fix.py — sawazisha src/ ya SokoMkononi na branding (tokens badala ya gray/hex/bg-white,
rangi za chati kutoka palette, text <12px -> text-xs, icons 9/11/13/15 -> 10/12/14/16).
Matumizi:  python3 branding_fix.py <njia ya src>     (inabadilisha faili mahali pake; ni idempotent)"""
import re, os, sys, glob
CHART_PATH = "pages/dashboard/admin/shared/chartColors.js"
SHARED = "pages/dashboard/components/shared.js"
NAVY_MARK = ("surface-night", "data-on-night", "dark-surface", "bg-night")
QHEX={"D1D5DB":"COLORS.sandLine","2563EB":"COLORS.royal","0062FD":"COLORS.royal","7C3AED":"COLORS.royalLight","0891B2":"CHART.slate",
"DB2777":"COLORS.goldInk","D97706":"COLORS.flame","EA580C":"COLORS.flame","DC2626":"COLORS.rust","CA8A04":"COLORS.goldInk",
"B45309":"COLORS.goldInk","16A34A":"COLORS.green","059669":"CHART.greenLight","6B7280":"CHART.slate","9CA3AF":"CHART.slateLight",
"CD7F32":"COLORS.goldInk","0A1F5C":"COLORS.night","FEA406":"COLORS.gold","2F6D4F":"COLORS.green","C1502E":"COLORS.rust",
"8A5A16":"COLORS.goldText","101A2E":"COLORS.night","F5F3EC":"COLORS.sand"}
CLS={"6B7280":"muted","9CA3AF":"muted","C1502E":"rust","2F6D4F":"green","FEA406":"gold","D98706":"flame","101A2E":"night","F5F3EC":"sand","9A6200":"gold-ink","182541":"night-soft","011957":"night"}
LIT={"2563EB":"#0062FD","7C3AED":"#3D8BFF","0891B2":"#626C80","DB2777":"#A35F00","D97706":"#FD8706","EA580C":"#FD8706","DC2626":"#C1502E","CA8A04":"#A35F00","B45309":"#A35F00","16A34A":"#2F6D4F","059669":"#5EC494","6B7280":"#626C80","9CA3AF":"#8C98B6","8A5A16":"#A35F00","D1D5DB":"#DCE4F2","101A2E":"#011957","F5F3EC":"#F4F7FC"}
RGBA={"232,163,61":"254,164,6","37,99,235":"0,98,253","124,58,237":"61,139,255","8,145,178":"98,108,128",
"219,39,119":"163,95,0","220,38,38":"193,80,46","180,83,9":"163,95,0","156,163,175":"140,152,182",
"16,26,46":"1,25,87","245,243,236":"244,247,252","217,119,6":"253,135,6"}
GRAY=[(r"border-gray-(?:100|200|300)","border-hairline"),(r"divide-gray-(?:100|200)","divide-hairline"),
(r"bg-gray-50","bg-page"),(r"bg-gray-100","bg-page"),(r"bg-gray-200","bg-hairline"),
(r"text-gray-(?:700|800|900)","text-primary"),(r"text-gray-(?:500|600)","text-secondary"),(r"text-gray-400","text-muted"),
(r"bg-amber-50","bg-gold/10"),(r"bg-green-50","bg-green/10"),(r"bg-red-50","bg-rust/10"),(r"bg-red-500","bg-rust"),(r"bg-gray-400","bg-muted")]
PRE=r"((?:[a-z0-9\[\]-]+:)*)"
stats={}
def tr(rel,s):
    name=os.path.basename(rel)
    is_jsx=rel.endswith('.jsx')
    navy=any(m in s for m in NAVY_MARK)
    st=dict(gray=0,hexcls=0,white=0,text=0,icon=0,qhex=0,rgba=0)
    goldmode="gold" if navy else "gold-ink"
    if name=="exportDealTranscript.js":
        for a,b in [("#8A5A16","#A35F00"),("#101A2E","#0D1630"),("#F5F3EC","#F4F7FC"),("#666","#455068"),("#999","#626C80"),("#ddd","#DCE4F2"),
                    ("font-family:Arial,sans-serif","font-family:'Open Sans',Arial,sans-serif")]:
            st['qhex']+=s.count(a); s=s.replace(a,b)
        if 'fonts.googleapis' not in s: s=s.replace('<meta charset="utf-8"/>','<meta charset="utf-8"/>\n      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>')
        return s,st
    for a,b in [("bg-[#101A2E] text-[#F5F3EC] border-[#101A2E]","bg-night text-sand border-night"),
                ("bg-white text-[#101A2E] border-gray-200","bg-card text-primary border-hairline"),
                ("rounded text-[#FEA406]","rounded text-gold")]:
        s=s.replace(a,b)
    out=[]
    for line in s.split("\n"):
        o=line
        # class hex
        def hx(m):
            pre,p,h=m.group(1),m.group(2),m.group(3).upper()
            if h not in CLS: return m.group(0)
            nm=CLS[h]
            if p=="text" and h=="FEA406": nm=goldmode
            if p=="text" and h=="101A2E": nm="night" if ("bg-[#FEA406]" in line or "bg-gold" in line) else "primary"
            st['hexcls']+=1
            return f"{pre}{p}-{nm}"
        o=re.sub(PRE+r"(text|bg|border|ring|accent|outline|from|to|via|fill|stroke|divide|placeholder)-\[#([0-9A-Fa-f]{6})\]",hx,o)
        for pat,rep in GRAY:
            o,n=re.subn(r"(?<![\w-])"+PRE+pat+r"(?![\w-])",lambda m:m.group(1)+rep,o); st['gray']+=n
        if "cursor-grab" not in o and "rounded-full bg-white shadow" not in o and not (navy and "surface-night" in s or "data-on-night" in s or "dark-surface" in s):
            o,n=re.subn(r"(?<![\w-])"+PRE+r"bg-white(?![\w/-])",lambda m:m.group(1)+"bg-card",o); st['white']+=n
        if "fallbackBg" not in o:
            o,n=re.subn(r"text-\[(?:9|10|11|12)px\]","text-xs",o); st['text']+=n
            o,n=re.subn(r"text-\[(?:13|14)px\]","text-sm",o); st['text']+=n
            o,n=re.subn(r"text-\[(?:15|16)px\]","text-base",o); st['text']+=n
            o=re.sub(r"(?<![\w:-])text-xs\s+sm:text-xs","text-xs",o)
            o=re.sub(r"(?<![\w:-])text-xs\s+sm:text-xs","text-xs",o)
        o,n=re.subn(r"size=\{(9|11|13|15)\}",lambda m:"size={%d}"%({"9":10,"11":12,"13":14,"15":16}[m.group(1)]),o); st['icon']+=n
        out.append(o)
    s="\n".join(out)
    if not is_jsx:
        for h,l in LIT.items(): s=re.sub(r'(["\'])#'+h+r'\1',lambda m:m.group(1)+l+m.group(1),s,flags=re.I)
        for a,b in RGBA.items():
            s,n=re.subn(r"rgba\(\s*"+a.replace(",",r"\s*,\s*")+r"\s*,",f"rgba({b},",s); st['rgba']+=n
        return s,st
    def q(m):
        h=m.group(2).upper()
        if h not in QHEX: return m.group(0)
        st['qhex']+=1
        return QHEX[h]
    s=re.sub(r"(=)?([\"'])#([0-9A-Fa-f]{6})\2",lambda m:(("={"+QHEX[m.group(3).upper()]+"}") if m.group(1) and m.group(3).upper() in QHEX else (QHEX[m.group(3).upper()] if m.group(3).upper() in QHEX else m.group(0))),s)
    for a,b in RGBA.items():
        s,n=re.subn(r"rgba\(\s*"+a.replace(",",r"\s*,\s*")+r"\s*,",f"rgba({b},",s); st['rgba']+=n
    W='"rgb(var(--c-card))"'
    s,n1=re.subn(r'(background:\s*)"white"',lambda m:m.group(1)+W,s)
    s,n2=re.subn(r'(background:\s*[^,{}]*?:\s*)"white"',lambda m:m.group(1)+W,s); st['white']+=n1+n2
    s=s.replace("linear-gradient(135deg, #011957 0%, #1a2842 100%)","linear-gradient(135deg, #011957 0%, #042475 100%)")
    s=s.replace('style={{ background: "#011957" }}','style={{ background: COLORS.night }}')
    # imports
    def add_import(s,line):
        ms=list(re.finditer(r'^import\b[\s\S]*?\bfrom\s+["\'][^"\']+["\'];?[ \t]*\n',s,re.M))
        e=ms[-1].end(); return s[:e]+line+"\n"+s[e:]
    d=os.path.dirname(rel)
    rel=lambda t:(os.path.relpath(t,d) if True else t)
    if re.search(r"\bCHART\.",s) and "chartColors" not in s:
        r=rel(CHART_PATH); r=r if r.startswith(".") else "./"+r
        s=add_import(s,f'import {{ CHART }} from "{r}";')
    if re.search(r"\bCOLORS\.",s) and not re.search(r"import\s*\{[^}]*\bCOLORS\b[^}]*\}\s*from",s) and not re.search(r"(const|let|var)\s+COLORS\b",s):
        r=rel(SHARED); r=r if r.startswith(".") else "./"+r
        s=add_import(s,f'import {{ COLORS }} from "{r}";')
    return s,st

def main(root):
    changed=0
    for f in sorted(glob.glob(os.path.join(root,"**","*.js*"),recursive=True)):
        rel=os.path.relpath(f,root).replace(os.sep,"/")
        if rel in (CHART_PATH,SHARED): continue
        s=open(f,encoding="utf-8",newline="").read()
        crlf="\r\n" in s
        o,st=tr(rel,s.replace("\r\n","\n"))
        if crlf: o=o.replace("\n","\r\n")
        if o!=s:
            open(f,"w",encoding="utf-8",newline="").write(o); changed+=1; print("•",rel,{k:v for k,v in st.items() if v})
    cp=os.path.join(root,CHART_PATH)
    if not os.path.exists(cp):
        os.makedirs(os.path.dirname(cp),exist_ok=True)
        open(cp,"w").write('export const CHART = { slate: "#626C80", slateLight: "#8C98B6", greenLight: "#5EC494" };\n')
    print("faili zilizobadilishwa:",changed)
if __name__=="__main__": main(sys.argv[1])
