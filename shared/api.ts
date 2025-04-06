type User = { id: string; name: string; };
userList: () => User[];
userById: (id: string) => User;
userCreate: (data: { name: string }) => User;