import './SchemaVisualizer.scss';

const SchemaVisualizer = ({ tables }) => {
    if (!tables || tables.length === 0) return null;

    // Detect foreign key relationships by looking for column names ending in _id
    const relationships = [];
    const tableNames = tables.map((t) => t.tableName);

    tables.forEach((table) => {
        (table.columns || []).forEach((col) => {
            if (col.name.endsWith('_id')) {
                const refName = col.name.replace('_id', '');
                // Check plural forms too
                const candidates = [refName, refName + 's', refName + 'es'];
                for (const c of candidates) {
                    if (tableNames.includes(c)) {
                        relationships.push({
                            from: table.tableName,
                            fromCol: col.name,
                            to: c,
                            toCol: 'id',
                        });
                        break;
                    }
                }
            }
        });
    });

    return (
        <div className="schema">
            <h3 className="schema__title">Schema Diagram</h3>
            <div className="schema__canvas">
                {tables.map((table) => (
                    <div key={table.tableName} className="schema__table" id={`schema-${table.tableName}`}>
                        <div className="schema__table-header">
                            {table.tableName}
                        </div>
                        <ul className="schema__table-cols">
                            {(table.columns || []).map((col) => {
                                const isFK = col.name.endsWith('_id');
                                const isPK = col.name === 'id';
                                return (
                                    <li
                                        key={col.name}
                                        className={`schema__col ${isPK ? 'schema__col--pk' : ''} ${isFK ? 'schema__col--fk' : ''}`}
                                    >
                                        <span className="schema__col-name">
                                            {isPK && '🔑 '}
                                            {isFK && '🔗 '}
                                            {col.name}
                                        </span>
                                        <span className="schema__col-type">{col.type}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {relationships.length > 0 && (
                <div className="schema__relations">
                    <h4>Relationships</h4>
                    {relationships.map((r, i) => (
                        <div key={i} className="schema__relation">
                            <span className="schema__relation-from">{r.from}.{r.fromCol}</span>
                            <span className="schema__relation-arrow">→</span>
                            <span className="schema__relation-to">{r.to}.{r.toCol}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SchemaVisualizer;
