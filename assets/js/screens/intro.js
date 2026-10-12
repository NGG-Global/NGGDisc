// Screen 1: intro (design/preview/Main.html).

export function render(root, ctx) {
  root.innerHTML = `
    <div class="screen screen--intro">
      <div class="logo-grid" aria-hidden="true">
        <span data-disc="D">D</span><span data-disc="I">I</span>
        <span data-disc="C">C</span><span data-disc="S">S</span>
      </div>

      <div class="intro-text">
        <div class="intro-text__eyebrow">שאלון סגנונות התנהגות · מודל DISC</div>
        <h1 tabindex="-1">איזה סגנון עבודה הכי מתאר אתכם?</h1>
        <p>בכל מסך יופיע צמד תכונות. בחרו את התכונה שמתארת טוב יותר את ההתנהגות שלכם בעבודה, גם אם שתיהן מתאימות לכם באופן חלקי.</p>
      </div>

      <div class="stats">
        <div class="stat"><div class="stat__num">${ctx.pairs.length}</div><div class="stat__label">צמדי תכונות</div></div>
        <div class="stat"><div class="stat__num">${ctx.questions.axes.length}</div><div class="stat__label">חלקים · מיקוד וקצב</div></div>
        <div class="stat"><div class="stat__num">~5</div><div class="stat__label">דקות</div></div>
      </div>

      <ol class="steps">
        <li class="step"><span class="step__num" aria-hidden="true">1</span><span class="step__text">עונים מהר, בתחושת בטן</span></li>
        <li class="step"><span class="step__num" aria-hidden="true">2</span><span class="step__text">רואים איפה אתם ממוקמים על מפת הסגנונות</span></li>
        <li class="step"><span class="step__num" aria-hidden="true">3</span><span class="step__text">קוראים על הסגנון שלכם ועל שלושת האחרים</span></li>
      </ol>

      <div class="spacer"></div>

      <div class="cta">
        <button type="button" class="btn-primary" data-action="start">מתחילים</button>
        <p class="fineprint">אין תשובות נכונות. השאלון נועד ללמידה עצמית ולשיחה במסגרת התוכנית, ואינו כלי להערכה.</p>
      </div>
    </div>`;

  root.querySelector('[data-action="start"]').addEventListener('click', () => {
    const first = ctx.firstUnanswered();
    ctx.go(first === null ? '#/result' : `#/q/${first}`);
  });

  return '';
}
