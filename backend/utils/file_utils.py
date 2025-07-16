def allowed_file(filename: str) -> bool:
  """
  Checks if a file's extension is allowed.
  This function assumes a predefined set of allowed extensions.

  Args:
      filename (str): The name of the file.

  Returns:
      bool: True if the file extension is allowed, False otherwise.
  """
  ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
  return '.' in filename and \
         filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
