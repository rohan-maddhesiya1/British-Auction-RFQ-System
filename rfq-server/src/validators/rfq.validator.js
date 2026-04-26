import { body, validationResult } from 'express-validator';

export const validateCreateRfq = [
  body('name').trim().notEmpty().withMessage('RFQ name is required'),
  body('refId').trim().notEmpty().withMessage('Reference ID is required'),
  body('bidStartAt').isISO8601().withMessage('Valid bid start date required'),
  body('bidCloseAt').isISO8601().withMessage('Valid bid close date required'),
  body('forcedCloseAt').isISO8601().withMessage('Valid forced close date required'),

  // British Auction config
  body('triggerWindowMins')
    .isInt({ min: 1 })
    .withMessage('Trigger window must be at least 1 minute'),
  body('extensionDurationMins')
    .isInt({ min: 1 })
    .withMessage('Extension duration must be at least 1 minute'),
  body('triggerType')
    .isIn(['BID_RECEIVED', 'ANY_RANK_CHANGE', 'L1_RANK_CHANGE'])
    .withMessage('Invalid trigger type'),

  // Cross-field time validation
  body('forcedCloseAt').custom((forcedCloseAt, { req }) => {
    if (new Date(forcedCloseAt) <= new Date(req.body.bidCloseAt)) {
      throw new Error('forcedCloseAt must be after bidCloseAt');
    }
    if (new Date(req.body.bidCloseAt) <= new Date(req.body.bidStartAt)) {
      throw new Error('bidCloseAt must be after bidStartAt');
    }
    return true;
  }),

  // Return errors if any
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];