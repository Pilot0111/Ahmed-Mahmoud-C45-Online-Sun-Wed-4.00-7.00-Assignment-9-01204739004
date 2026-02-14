export const responseSuccess = ({
  res,
  message = "done",
  data = undefined,
  status = 200,
} = {}) => {
  res.status(status).json({ message, data });
};
