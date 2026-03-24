const StatsBar = () => (
    <div className="stats-bar">
        {[
            { val: "100%",  label: "Satisfactions Clients" },
            { val: "500+",  label: "Property sells" },
            { val: "150+",  label: "Countries & Cities" },
            { val: "2,00+", label: "Positive reviews" },
        ].map((s, i) => (
            <div className="stats-bar__item" key={i}>
                <span className="stats-bar__val">{s.val}</span>
                <span className="stats-bar__label">{s.label}</span>
            </div>
        ))}
    </div>
)

export default StatsBar