import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { mockAuthenticatedUser, prismaMock, testUser } from "./testUtils.js";

describe("POST /api/v1/users/me/hobbies (curation invariant: at least one hobby)", () => {
  it("rejects an empty selection", async () => {
    const token = mockAuthenticatedUser();

    const res = await request(app)
      .post("/api/v1/users/me/hobbies")
      .set("Authorization", `Bearer ${token}`)
      .send({ hobbyIds: [] });

    expect(res.status).toBe(400);
  });

  it("rejects hobby ids that don't exist in the taxonomy", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findMany.mockResolvedValueOnce([{ id: "hobby_dance" }] as never);

    const res = await request(app)
      .post("/api/v1/users/me/hobbies")
      .set("Authorization", `Bearer ${token}`)
      .send({ hobbyIds: ["hobby_dance", "hobby_made_up"] });

    expect(res.status).toBe(400);
  });

  it("replaces the selection when all ids are valid", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.hobby.findMany.mockResolvedValueOnce([{ id: "hobby_dance" }] as never);
    prismaMock.userHobby.findMany.mockResolvedValueOnce([
      { hobby: { id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" } },
    ] as never);

    const res = await request(app)
      .post("/api/v1/users/me/hobbies")
      .set("Authorization", `Bearer ${token}`)
      .send({ hobbyIds: ["hobby_dance"] });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ id: "hobby_dance", name: "Dance", slug: "dance", icon: "💃" }]);
  });
});

describe("DELETE /api/v1/users/me/hobbies/:hobbyId (leave a single hobby)", () => {
  it("is a no-op if the caller isn't a member", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete("/api/v1/users/me/hobbies/hobby_dance")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.removed).toBe(false);
  });

  it("blocks leaving your last remaining hobby", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findUnique.mockResolvedValueOnce({ userId: testUser.id, hobbyId: "hobby_dance" } as never);
    prismaMock.userHobby.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .delete("/api/v1/users/me/hobbies/hobby_dance")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("allows leaving when the caller has other hobbies left", async () => {
    const token = mockAuthenticatedUser();
    prismaMock.userHobby.findUnique.mockResolvedValueOnce({ userId: testUser.id, hobbyId: "hobby_dance" } as never);
    prismaMock.userHobby.count.mockResolvedValueOnce(2);
    prismaMock.userHobby.delete.mockResolvedValueOnce({} as never);

    const res = await request(app)
      .delete("/api/v1/users/me/hobbies/hobby_dance")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.removed).toBe(true);
  });
});
