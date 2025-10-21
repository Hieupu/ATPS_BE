class Account {
  constructor({
    AccID,
    Username,
    Email,
    Phone,
    Password,
    Status,
    Provider,
  }) {
    this.AccID = AccID;
    this.Username = Username;
    this.Email = Email;
    this.Phone = Phone;
    this.Password = Password;
    this.Status = Status;
    this.Provider = Provider || "local";
  }
}
