const RfqConfigForm = ({ value, onChange }) => {
  const update = (field, nextValue) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label>
        <span className="field-label">Trigger window X (mins)</span>
        <input
          className="input"
          min="1"
          type="number"
          value={value.triggerWindowMins}
          onChange={(event) => update('triggerWindowMins', event.target.value)}
          required
        />
      </label>

      <label>
        <span className="field-label">Extension duration Y (mins)</span>
        <input
          className="input"
          min="1"
          type="number"
          value={value.extensionDurationMins}
          onChange={(event) => update('extensionDurationMins', event.target.value)}
          required
        />
      </label>

      <label>
        <span className="field-label">Trigger type</span>
        <select
          className="input"
          value={value.triggerType}
          onChange={(event) => update('triggerType', event.target.value)}
          required
        >
          <option value="BID_RECEIVED">Bid received</option>
          <option value="ANY_RANK_CHANGE">Any rank change</option>
          <option value="L1_RANK_CHANGE">L1 rank change</option>
        </select>
      </label>
    </div>
  );
};

export default RfqConfigForm;
